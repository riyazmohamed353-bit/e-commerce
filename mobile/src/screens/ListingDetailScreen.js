import React, {
  useCallback,
  useEffect,
  useState,
} from 'react';

import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Dimensions,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import client from '../api/client';
import { useAuth } from '../context/AuthContext';

import {
  colors,
  spacing,
  radius,
  shadow,
} from '../theme/theme';

const SCREEN_WIDTH =
  Dimensions.get('window').width;

export default function ListingDetailScreen({
  route,
  navigation,
}) {
  // ============================================================
  // ROUTE
  // ============================================================

  const {
    listingId,
  } = route.params || {};

  // ============================================================
  // AUTH
  // ============================================================

  const { user } = useAuth();

  const currentUserId =
    user?._id ||
    user?.id;

  // ============================================================
  // STATE
  // ============================================================

  const [listing, setListing] =
    useState(null);

  const [negotiation, setNegotiation] =
    useState(null);

  const [selectedPhoto, setSelectedPhoto] =
    useState(0);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [negotiationLoading, setNegotiationLoading] =
    useState(false);

  // ============================================================
  // LOAD LISTING
  // ============================================================

  const loadListing =
    useCallback(async () => {
      if (!listingId) {
        setLoading(false);

        Alert.alert(
          'Error',
          'Listing ID is missing.'
        );

        return;
      }

      try {
        setLoading(true);

        const response =
          await client.get(
            `/listings/${listingId}`
          );

        console.log(
          'LISTING LOADED:',
          response.data
        );

        console.log(
          'PHOTOS:',
          response.data?.photos
        );

        const loadedListing =
          response.data?.listing ||
          response.data;

        setListing(
          loadedListing
        );

        setSelectedPhoto(0);

      } catch (err) {
        console.log(
          'LOAD LISTING ERROR:',
          err.response?.data ||
            err.message
        );

        Alert.alert(
          'Could not load listing',
          err.response?.data?.message ||
            'Unable to load this listing. Please try again.'
        );

      } finally {
        setLoading(false);
      }
    }, [listingId]);

  // ============================================================
  // INITIAL LOAD
  // ============================================================

  useEffect(() => {
    loadListing();
  }, [loadListing]);

  // ============================================================
  // REFRESH
  // ============================================================

  const onRefresh =
    async () => {
      setRefreshing(true);

      await loadListing();

      setRefreshing(false);
    };

  // ============================================================
  // AI NEGOTIATION
  // ============================================================

  const getNegotiationTip =
    async () => {
      if (!listing) {
        return;
      }

      const sellerPrice =
        Number(
          listing.sellerPrice
        );

      const aiEstimate =
        Number(
          listing.aiEstimate
            ?.recommended
        );

      const conditionScore =
        Number(
          listing.aiCondition
            ?.score ?? 80
        );

      if (
        !sellerPrice ||
        sellerPrice <= 0
      ) {
        Alert.alert(
          'Invalid seller price',
          'This listing does not have a valid selling price.'
        );

        return;
      }

      if (
        !aiEstimate ||
        aiEstimate <= 0
      ) {
        Alert.alert(
          'AI price unavailable',
          'The AI Fair Price has not been calculated for this listing yet.'
        );

        return;
      }

      try {
        setNegotiationLoading(true);

        setNegotiation(null);

        const response =
          await client.post(
            '/ai/negotiate',
            {
              sellerPrice,
              aiEstimate,
              conditionScore,
            }
          );

        console.log(
          'NEGOTIATION RESPONSE:',
          response.data
        );

        setNegotiation(
          response.data?.negotiation ||
            response.data
        );

      } catch (err) {
        console.log(
          'NEGOTIATION ERROR:',
          err.response?.data ||
            err.message
        );

        Alert.alert(
          'AI Negotiation unavailable',
          err.response?.data?.message ||
            'Could not generate a negotiation suggestion. Please try again.'
        );

      } finally {
        setNegotiationLoading(false);
      }
    };

  // ============================================================
  // OPEN CHAT
  // ============================================================

  const openChat =
    () => {
      if (!listing) {
        return;
      }

      const sellerId =
        listing.seller?._id ||
        listing.seller?.id ||
        listing.seller;

      const sellerName =
        listing.seller?.name ||
        listing.seller?.username ||
        'Seller';

      if (!sellerId) {
        Alert.alert(
          'Unable to message seller',
          'Seller information is not available.'
        );

        return;
      }

      console.log(
        'OPENING CHAT:',
        {
          userId: sellerId,
          userName: sellerName,
          listingId: listing._id,
        }
      );

      /*
       * IMPORTANT
       *
       * ChatScreen expects:
       *
       * userId
       * userName
       *
       * Do NOT use sellerId/sellerName here.
       */

      navigation.navigate(
        'Chat',
        {
          userId: String(
            sellerId
          ),

          userName:
            sellerName,

          listingId:
            listing._id,
        }
      );
    };

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <View
        style={
          styles.loadingContainer
        }
      >
        <ActivityIndicator
          size="large"
          color={
            colors.primary ||
            '#2563eb'
          }
        />

        <Text
          style={
            styles.loadingText
          }
        >
          Loading listing...
        </Text>
      </View>
    );
  }

  // ============================================================
  // LISTING NOT FOUND
  // ============================================================

  if (!listing) {
    return (
      <View
        style={
          styles.loadingContainer
        }
      >
        <Ionicons
          name="alert-circle-outline"
          size={50}
          color="#94a3b8"
        />

        <Text
          style={
            styles.errorTitle
          }
        >
          Listing not found
        </Text>

        <TouchableOpacity
          style={
            styles.retryButton
          }
          onPress={loadListing}
        >
          <Text
            style={
              styles.retryButtonText
            }
          >
            Try Again
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ============================================================
  // PHOTOS
  // ============================================================

  const photos =
    Array.isArray(
      listing.photos
    )
      ? listing.photos.filter(
          Boolean
        )
      : [];

  const currentPhoto =
    photos[selectedPhoto] ||
    photos[0];

  // ============================================================
  // SELLER
  // ============================================================

  const sellerId =
    listing.seller?._id ||
    listing.seller?.id ||
    listing.seller;

  const isOwner =
    currentUserId &&
    sellerId &&
    String(
      currentUserId
    ) ===
      String(sellerId);

  // ============================================================
  // CONDITION
  // ============================================================

  const conditionScore =
    listing.aiCondition?.score;

  // ============================================================
  // UI
  // ============================================================

  return (
    <ScrollView
      style={
        styles.container
      }
      contentContainerStyle={
        styles.contentContainer
      }
      refreshControl={
        <RefreshControl
          refreshing={
            refreshing
          }
          onRefresh={
            onRefresh
          }
        />
      }
      showsVerticalScrollIndicator={
        false
      }
    >
      {/* ======================================================
          PHOTO
      ====================================================== */}

      {photos.length > 0 ? (
        <View
          style={
            styles.photoSection
          }
        >
          <Image
            source={{
              uri: currentPhoto,
            }}
            style={
              styles.mainImage
            }
            resizeMode="contain"
          />

          {photos.length > 1 && (
            <View
              style={
                styles.photoCounter
              }
            >
              <Ionicons
                name="images-outline"
                size={15}
                color="#fff"
              />

              <Text
                style={
                  styles.photoCounterText
                }
              >
                {selectedPhoto + 1}
                {' / '}
                {photos.length}
              </Text>
            </View>
          )}
        </View>
      ) : (
        <View
          style={
            styles.noImage
          }
        >
          <Ionicons
            name="image-outline"
            size={55}
            color="#94a3b8"
          />

          <Text
            style={
              styles.noImageText
            }
          >
            No photo available
          </Text>
        </View>
      )}

      {/* ======================================================
          THUMBNAILS
      ====================================================== */}

      {photos.length > 1 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={
            false
          }
          contentContainerStyle={
            styles.thumbnailContainer
          }
        >
          {photos.map(
            (
              photo,
              index
            ) => (
              <TouchableOpacity
                key={`${photo}-${index}`}
                onPress={() =>
                  setSelectedPhoto(
                    index
                  )
                }
                style={[
                  styles.thumbnailWrapper,
                  selectedPhoto ===
                    index &&
                    styles.selectedThumbnail,
                ]}
              >
                <Image
                  source={{
                    uri: photo,
                  }}
                  style={
                    styles.thumbnail
                  }
                  resizeMode="cover"
                />
              </TouchableOpacity>
            )
          )}
        </ScrollView>
      )}

      {/* ======================================================
          BODY
      ====================================================== */}

      <View
        style={
          styles.body
        }
      >
        {/* CATEGORY */}

        {listing.category && (
          <Text
            style={
              styles.category
            }
          >
            {String(
              listing.category
            ).toUpperCase()}
          </Text>
        )}

        {/* TITLE */}

        <Text
          style={
            styles.title
          }
        >
          {listing.title ||
            'Untitled listing'}
        </Text>

        {/* PRICE */}

        <Text
          style={
            styles.price
          }
        >
          ₹
          {Number(
            listing.sellerPrice ||
              0
          ).toLocaleString(
            'en-IN'
          )}
        </Text>

        {/* ====================================================
            FRAUD WARNING
        ==================================================== */}

        {listing.isSuspicious && (
          <View
            style={
              styles.warningBox
            }
          >
            <View
              style={
                styles.warningIcon
              }
            >
              <Ionicons
                name="warning-outline"
                size={22}
                color="#dc2626"
              />
            </View>

            <View
              style={{
                flex: 1,
              }}
            >
              <Text
                style={
                  styles.warningTitle
                }
              >
                Suspicious Listing
              </Text>

              <Text
                style={
                  styles.warning
                }
              >
                {listing.suspiciousReason ||
                  'This listing may require additional verification.'}
              </Text>
            </View>
          </View>
        )}

        {/* ====================================================
            AI FAIR PRICE
        ==================================================== */}

        {listing.aiEstimate && (
          <View
            style={
              styles.aiCard
            }
          >
            <View
              style={
                styles.aiHeader
              }
            >
              <View
                style={
                  styles.aiIcon
                }
              >
                <Ionicons
                  name="sparkles"
                  size={20}
                  color="#2563eb"
                />
              </View>

              <View
                style={{
                  flex: 1,
                }}
              >
                <Text
                  style={
                    styles.aiTitle
                  }
                >
                  AI Fair Price
                </Text>

                <Text
                  style={
                    styles.aiSubtitle
                  }
                >
                  Estimated market value
                </Text>
              </View>
            </View>

            <Text
              style={
                styles.aiPrice
              }
            >
              ₹
              {Number(
                listing.aiEstimate
                  .low || 0
              ).toLocaleString(
                'en-IN'
              )}

              {' – '}

              ₹
              {Number(
                listing.aiEstimate
                  .high || 0
              ).toLocaleString(
                'en-IN'
              )}
            </Text>

            {listing.aiEstimate
              .recommended && (
              <View
                style={
                  styles.recommendedBox
                }
              >
                <Ionicons
                  name="checkmark-circle"
                  size={18}
                  color="#16a34a"
                />

                <Text
                  style={
                    styles.recommended
                  }
                >
                  Recommended ₹
                  {Number(
                    listing.aiEstimate
                      .recommended
                  ).toLocaleString(
                    'en-IN'
                  )}
                </Text>
              </View>
            )}

            {listing.aiEstimate
              .reasoning && (
              <Text
                style={
                  styles.aiReasoning
                }
              >
                {
                  listing.aiEstimate
                    .reasoning
                }
              </Text>
            )}
          </View>
        )}

        {/* ====================================================
            AI CONDITION
        ==================================================== */}

        {listing.aiCondition && (
          <View
            style={
              styles.aiCard
            }
          >
            <View
              style={
                styles.aiHeader
              }
            >
              <View
                style={
                  styles.aiIcon
                }
              >
                <Ionicons
                  name="scan-outline"
                  size={20}
                  color="#7c3aed"
                />
              </View>

              <View
                style={{
                  flex: 1,
                }}
              >
                <Text
                  style={
                    styles.aiTitle
                  }
                >
                  AI Photo Condition
                </Text>

                <Text
                  style={
                    styles.aiSubtitle
                  }
                >
                  AI analysis of uploaded photos
                </Text>
              </View>
            </View>

            <View
              style={
                styles.conditionRow
              }
            >
              <Text
                style={
                  styles.conditionScore
                }
              >
                {conditionScore ??
                  '-'}
              </Text>

              <Text
                style={
                  styles.conditionOutOf
                }
              >
                /100
              </Text>
            </View>

            <View
              style={
                styles.conditionTrack
              }
            >
              <View
                style={[
                  styles.conditionFill,
                  {
                    width: `${Math.max(
                      0,
                      Math.min(
                        100,
                        Number(
                          conditionScore ||
                            0
                        )
                      )
                    )}%`,
                  },
                ]}
              />
            </View>

            {listing.aiCondition
              .issues?.length >
            0 ? (
              <View
                style={
                  styles.issuesContainer
                }
              >
                <Text
                  style={
                    styles.issuesTitle
                  }
                >
                  Detected issues
                </Text>

                {listing.aiCondition.issues.map(
                  (
                    issue,
                    index
                  ) => (
                    <View
                      key={`${issue}-${index}`}
                      style={
                        styles.issueRow
                      }
                    >
                      <Ionicons
                        name="alert-circle-outline"
                        size={17}
                        color="#f97316"
                      />

                      <Text
                        style={
                          styles.issueText
                        }
                      >
                        {issue}
                      </Text>
                    </View>
                  )
                )}
              </View>
            ) : (
              <View
                style={
                  styles.noIssuesRow
                }
              >
                <Ionicons
                  name="checkmark-circle"
                  size={18}
                  color="#16a34a"
                />

                <Text
                  style={
                    styles.noIssues
                  }
                >
                  No major issues detected.
                </Text>
              </View>
            )}
          </View>
        )}

        {/* ====================================================
            SPECIFICATIONS
        ==================================================== */}

        <Text
          style={
            styles.sectionLabel
          }
        >
          Specifications
        </Text>

        <View
          style={
            styles.specBox
          }
        >
          <SpecRow
            icon="pricetag-outline"
            label="Brand"
            value={
              listing.brand
            }
          />

          <SpecRow
            icon="phone-portrait-outline"
            label="Model"
            value={
              listing.model
            }
          />

          <SpecRow
            icon="grid-outline"
            label="Category"
            value={
              listing.category
            }
          />

          <SpecRow
            icon="server-outline"
            label="Storage"
            value={
              listing.specs
                ?.storage
            }
          />

          <SpecRow
            icon="hardware-chip-outline"
            label="RAM"
            value={
              listing.specs?.ram
            }
          />

          <SpecRow
            icon="time-outline"
            label="Age"
            value={
              listing.specs
                ?.ageMonths !=
              null
                ? `${listing.specs.ageMonths} months`
                : null
            }
          />

          <SpecRow
            icon="battery-half-outline"
            label="Battery Health"
            value={
              listing.specs
                ?.batteryHealth !=
              null
                ? `${listing.specs.batteryHealth}%`
                : null
            }
            last
          />
        </View>

        {/* ====================================================
            DESCRIPTION
        ==================================================== */}

        {listing.conditionText ? (
          <>
            <Text
              style={
                styles.sectionLabel
              }
            >
              Seller Description
            </Text>

            <View
              style={
                styles.descriptionBox
              }
            >
              <Text
                style={
                  styles.description
                }
              >
                {
                  listing.conditionText
                }
              </Text>
            </View>
          </>
        ) : null}

        {/* ====================================================
            SELLER
        ==================================================== */}

        <Text
          style={
            styles.sectionLabel
          }
        >
          Seller
        </Text>

        <View
          style={
            styles.sellerBox
          }
        >
          <View
            style={
              styles.sellerAvatar
            }
          >
            <Text
              style={
                styles.sellerAvatarText
              }
            >
              {(
                listing.seller
                  ?.name ||
                'S'
              )
                .charAt(0)
                .toUpperCase()}
            </Text>
          </View>

          <View
            style={{
              flex: 1,
            }}
          >
            <Text
              style={
                styles.sellerName
              }
            >
              {listing.seller
                ?.name ||
                'Seller'}
            </Text>

            <Text
              style={
                styles.sellerSubtitle
              }
            >
              Marketplace seller
            </Text>
          </View>

          <Ionicons
            name="chevron-forward"
            size={20}
            color="#94a3b8"
          />
        </View>

        {/* ====================================================
            AI NEGOTIATION
        ==================================================== */}

        {!isOwner && (
          <>
            <TouchableOpacity
              style={[
                styles.secondaryBtn,
                negotiationLoading &&
                  styles.disabledButton,
              ]}
              onPress={
                getNegotiationTip
              }
              disabled={
                negotiationLoading
              }
              activeOpacity={0.8}
            >
              {negotiationLoading ? (
                <>
                  <ActivityIndicator
                    size="small"
                    color="#2563eb"
                  />

                  <Text
                    style={
                      styles.secondaryBtnText
                    }
                  >
                    AI is calculating...
                  </Text>
                </>
              ) : (
                <>
                  <Ionicons
                    name="sparkles-outline"
                    size={19}
                    color="#2563eb"
                  />

                  <Text
                    style={
                      styles.secondaryBtnText
                    }
                  >
                    Get AI Negotiation Tip
                  </Text>
                </>
              )}
            </TouchableOpacity>

            {negotiation && (
              <View
                style={
                  styles.negotiationCard
                }
              >
                <View
                  style={
                    styles.negotiationHeader
                  }
                >
                  <Ionicons
                    name="cash-outline"
                    size={21}
                    color="#16a34a"
                  />

                  <Text
                    style={
                      styles.negotiationTitle
                    }
                  >
                    Suggested Offer
                  </Text>
                </View>

                <Text
                  style={
                    styles.negotiationPrice
                  }
                >
                  ₹
                  {Number(
                    negotiation.offerLow ||
                      0
                  ).toLocaleString(
                    'en-IN'
                  )}

                  {' – '}

                  ₹
                  {Number(
                    negotiation.offerHigh ||
                      0
                  ).toLocaleString(
                    'en-IN'
                  )}
                </Text>

                {negotiation.message && (
                  <View
                    style={
                      styles.messageSuggestion
                    }
                  >
                    <Text
                      style={
                        styles.messageSuggestionLabel
                      }
                    >
                      Suggested message
                    </Text>

                    <Text
                      style={
                        styles.messageSuggestionText
                      }
                    >
                      "{negotiation.message}"
                    </Text>
                  </View>
                )}
              </View>
            )}
          </>
        )}

        {/* ====================================================
            MESSAGE SELLER
        ==================================================== */}

        {!isOwner &&
          sellerId && (
            <TouchableOpacity
              style={
                styles.chatBtn
              }
              onPress={
                openChat
              }
              activeOpacity={0.8}
            >
              <Ionicons
                name="chatbubble-ellipses-outline"
                size={21}
                color="#fff"
              />

              <Text
                style={
                  styles.chatBtnText
                }
              >
                Message Seller
              </Text>
            </TouchableOpacity>
          )}

        {/* ====================================================
            OWNER
        ==================================================== */}

        {isOwner && (
          <View
            style={
              styles.ownerBox
            }
          >
            <Ionicons
              name="information-circle-outline"
              size={20}
              color="#64748b"
            />

            <Text
              style={
                styles.ownerText
              }
            >
              This is your listing.
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

// ============================================================
// SPEC ROW
// ============================================================

function SpecRow({
  icon,
  label,
  value,
  last = false,
}) {
  return (
    <View
      style={[
        styles.specRow,
        last &&
          styles.lastSpecRow,
      ]}
    >
      <View
        style={
          styles.specLabelContainer
        }
      >
        <Ionicons
          name={icon}
          size={18}
          color="#64748b"
        />

        <Text
          style={
            styles.specLabel
          }
        >
          {label}
        </Text>
      </View>

      <Text
        style={
          styles.specValue
        }
      >
        {value || '-'}
      </Text>
    </View>
  );
}

// ============================================================
// STYLES
// ============================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor:
      '#f8fafc',
  },

  contentContainer: {
    paddingBottom: 50,
  },

  loadingContainer: {
    flex: 1,
    justifyContent:
      'center',
    alignItems:
      'center',
    backgroundColor:
      '#f8fafc',
    padding: 30,
  },

  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: '#64748b',
  },

  errorTitle: {
    marginTop: 12,
    fontSize: 18,
    fontWeight: '700',
    color: '#334155',
  },

  retryButton: {
    marginTop: 20,
    backgroundColor:
      '#2563eb',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },

  retryButtonText: {
    color: '#fff',
    fontWeight: '700',
  },

  // PHOTO

  photoSection: {
    width: '100%',
    height: 320,
    backgroundColor: '#fff',
    position: 'relative',
  },

  mainImage: {
    width: '100%',
    height: '100%',
  },

  photoCounter: {
    position: 'absolute',
    right: 14,
    bottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor:
      'rgba(0,0,0,0.7)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
  },

  photoCounterText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },

  noImage: {
    width: '100%',
    height: 320,
    justifyContent:
      'center',
    alignItems:
      'center',
    backgroundColor:
      '#e2e8f0',
  },

  noImageText: {
    marginTop: 10,
    color: '#64748b',
    fontSize: 15,
  },

  // THUMBNAILS

  thumbnailContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
    backgroundColor: '#fff',
  },

  thumbnailWrapper: {
    borderRadius: 10,
    borderWidth: 2,
    borderColor:
      'transparent',
    padding: 2,
  },

  selectedThumbnail: {
    borderColor:
      '#2563eb',
  },

  thumbnail: {
    width: 68,
    height: 68,
    borderRadius: 7,
    backgroundColor:
      '#e2e8f0',
  },

  // BODY

  body: {
    padding: 16,
  },

  category: {
    fontSize: 12,
    fontWeight: '800',
    color: '#2563eb',
    letterSpacing: 0.7,
    marginBottom: 6,
  },

  title: {
    fontSize: 23,
    fontWeight: '800',
    color: '#111827',
    lineHeight: 30,
  },

  price: {
    fontSize: 27,
    fontWeight: '900',
    color: '#111827',
    marginTop: 8,
    marginBottom: 4,
  },

  // WARNING

  warningBox: {
    flexDirection: 'row',
    alignItems:
      'flex-start',
    gap: 10,
    backgroundColor:
      '#fef2f2',
    borderWidth: 1,
    borderColor:
      '#fecaca',
    padding: 13,
    borderRadius: 12,
    marginTop: 14,
  },

  warningIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor:
      '#fee2e2',
    alignItems:
      'center',
    justifyContent:
      'center',
  },

  warningTitle: {
    color: '#b91c1c',
    fontWeight: '800',
    fontSize: 14,
    marginBottom: 3,
  },

  warning: {
    color: '#dc2626',
    lineHeight: 19,
    fontSize: 13,
  },

  // AI

  aiCard: {
    backgroundColor:
      '#fff',
    borderRadius: 15,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor:
      '#e2e8f0',
    ...shadow.sm,
  },

  aiHeader: {
    flexDirection: 'row',
    alignItems:
      'center',
    gap: 11,
  },

  aiIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor:
      '#eff6ff',
    alignItems:
      'center',
    justifyContent:
      'center',
  },

  aiTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },

  aiSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },

  aiPrice: {
    fontSize: 21,
    fontWeight: '900',
    color: '#2563eb',
    marginTop: 16,
  },

  recommendedBox: {
    flexDirection: 'row',
    alignItems:
      'center',
    gap: 6,
    marginTop: 9,
  },

  recommended: {
    color: '#16a34a',
    fontWeight: '800',
    fontSize: 14,
  },

  aiReasoning: {
    color: '#64748b',
    marginTop: 10,
    lineHeight: 20,
    fontSize: 13,
  },

  // CONDITION

  conditionRow: {
    flexDirection: 'row',
    alignItems:
      'flex-end',
    marginTop: 15,
  },

  conditionScore: {
    fontSize: 30,
    fontWeight: '900',
    color: '#7c3aed',
  },

  conditionOutOf: {
    fontSize: 15,
    color: '#64748b',
    marginBottom: 5,
    marginLeft: 3,
  },

  conditionTrack: {
    height: 9,
    backgroundColor:
      '#e2e8f0',
    borderRadius: 20,
    overflow: 'hidden',
    marginTop: 9,
  },

  conditionFill: {
    height: '100%',
    backgroundColor:
      '#7c3aed',
    borderRadius: 20,
  },

  issuesContainer: {
    marginTop: 15,
  },

  issuesTitle: {
    fontWeight: '800',
    color: '#334155',
    marginBottom: 8,
  },

  issueRow: {
    flexDirection: 'row',
    alignItems:
      'flex-start',
    gap: 8,
    marginTop: 6,
  },

  issueText: {
    flex: 1,
    color: '#475569',
    lineHeight: 19,
  },

  noIssuesRow: {
    flexDirection: 'row',
    alignItems:
      'center',
    gap: 7,
    marginTop: 13,
  },

  noIssues: {
    color: '#16a34a',
    fontWeight: '700',
  },

  // SECTIONS

  sectionLabel: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    marginTop: 24,
    marginBottom: 10,
  },

  // SPECIFICATIONS

  specBox: {
    backgroundColor:
      '#fff',
    borderRadius: 14,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor:
      '#e2e8f0',
  },

  specRow: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems:
      'center',
    justifyContent:
      'space-between',
    borderBottomWidth: 1,
    borderBottomColor:
      '#f1f5f9',
  },

  lastSpecRow: {
    borderBottomWidth: 0,
  },

  specLabelContainer: {
    flexDirection: 'row',
    alignItems:
      'center',
    gap: 9,
  },

  specLabel: {
    color: '#64748b',
    fontSize: 14,
  },

  specValue: {
    color: '#111827',
    fontWeight: '700',
    fontSize: 14,
    maxWidth:
      SCREEN_WIDTH * 0.45,
    textAlign: 'right',
  },

  // DESCRIPTION

  descriptionBox: {
    backgroundColor:
      '#fff',
    borderRadius: 14,
    padding: 15,
    borderWidth: 1,
    borderColor:
      '#e2e8f0',
  },

  description: {
    color: '#475569',
    lineHeight: 22,
    fontSize: 14,
  },

  // SELLER

  sellerBox: {
    flexDirection: 'row',
    alignItems:
      'center',
    gap: 12,
    backgroundColor:
      '#fff',
    borderRadius: 14,
    padding: 15,
    borderWidth: 1,
    borderColor:
      '#e2e8f0',
  },

  sellerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor:
      '#dbeafe',
    alignItems:
      'center',
    justifyContent:
      'center',
  },

  sellerAvatarText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#2563eb',
  },

  sellerName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },

  sellerSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 3,
  },

  // NEGOTIATION

  secondaryBtn: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems:
      'center',
    justifyContent:
      'center',
    gap: 8,
    backgroundColor:
      '#eff6ff',
    borderRadius: 12,
    marginTop: 18,
    borderWidth: 1,
    borderColor:
      '#bfdbfe',
  },

  disabledButton: {
    opacity: 0.65,
  },

  secondaryBtnText: {
    color: '#2563eb',
    fontWeight: '800',
    fontSize: 14,
  },

  negotiationCard: {
    backgroundColor:
      '#f0fdf4',
    borderRadius: 14,
    padding: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor:
      '#bbf7d0',
  },

  negotiationHeader: {
    flexDirection: 'row',
    alignItems:
      'center',
    gap: 8,
  },

  negotiationTitle: {
    color: '#166534',
    fontWeight: '800',
    fontSize: 15,
  },

  negotiationPrice: {
    color: '#15803d',
    fontWeight: '900',
    fontSize: 22,
    marginTop: 12,
  },

  messageSuggestion: {
    backgroundColor:
      '#fff',
    padding: 12,
    borderRadius: 10,
    marginTop: 12,
  },

  messageSuggestionLabel: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 5,
  },

  messageSuggestionText: {
    color: '#334155',
    lineHeight: 20,
    fontSize: 14,
  },

  // CHAT

  chatBtn: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems:
      'center',
    justifyContent:
      'center',
    gap: 9,
    backgroundColor:
      '#2563eb',
    borderRadius: 13,
    marginTop: 14,
    ...shadow.sm,
  },

  chatBtnText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 16,
  },

  // OWNER

  ownerBox: {
    flexDirection: 'row',
    alignItems:
      'center',
    justifyContent:
      'center',
    gap: 8,
    marginTop: 18,
    padding: 13,
    backgroundColor:
      '#f1f5f9',
    borderRadius: 10,
  },

  ownerText: {
    color: '#64748b',
    fontWeight: '600',
  },
});
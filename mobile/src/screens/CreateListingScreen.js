import React, { useCallback, useEffect, useState } from 'react';

import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';

import client from '../api/client';

const MAX_IMAGES = 6;

const CATEGORIES = [
  'Mobile',
  'Laptop',
  'Tablet',
  'Smartwatch',
  'Headphones',
  'Camera',
  'Gaming',
  'Other',
];

export default function CreateListingScreen({ navigation, route }) {
  // ============================================================
  // EDIT MODE
  // ============================================================

  const editingListingId =
    route?.params?.listingId ||
    route?.params?.id ||
    null;

  const isEditMode = Boolean(editingListingId);

  // ============================================================
  // FORM STATE
  // ============================================================

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [sellerPrice, setSellerPrice] = useState('');

  const [storage, setStorage] = useState('');
  const [ram, setRam] = useState('');
  const [ageMonths, setAgeMonths] = useState('');
  const [batteryHealth, setBatteryHealth] = useState('');

  const [conditionText, setConditionText] = useState('');

  // Array of objects:
  // {
  //   uri: '...',
  //   isNew: true/false
  // }
  const [photos, setPhotos] = useState([]);

  const [loadingListing, setLoadingListing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // ============================================================
  // LOAD EXISTING LISTING
  // ============================================================

  const loadListing = useCallback(async () => {
    if (!editingListingId) {
      return;
    }

    try {
      setLoadingListing(true);

      console.log(
        '========================================'
      );
      console.log('LOADING EDIT LISTING');
      console.log('LISTING ID:', editingListingId);
      console.log(
        '========================================'
      );

      const response = await client.get(
        `/listings/${editingListingId}`
      );

      console.log(
        'GET LISTING RESPONSE:',
        response.data
      );

      const listing =
        response.data?.listing ||
        response.data?.data ||
        response.data;

      if (!listing) {
        throw new Error('Listing not found.');
      }

      // ----------------------------------------------------------
      // BASIC DETAILS
      // ----------------------------------------------------------

      setTitle(
        listing.title != null
          ? String(listing.title)
          : ''
      );

      setCategory(
        listing.category != null
          ? String(listing.category)
          : ''
      );

      setBrand(
        listing.brand != null
          ? String(listing.brand)
          : ''
      );

      setModel(
        listing.model != null
          ? String(listing.model)
          : ''
      );

      setSellerPrice(
        listing.sellerPrice != null
          ? String(listing.sellerPrice)
          : ''
      );

      // ----------------------------------------------------------
      // SPECS
      // ----------------------------------------------------------

      const specs = listing.specs || {};

      setStorage(
        specs.storage != null
          ? String(specs.storage)
          : ''
      );

      setRam(
        specs.ram != null
          ? String(specs.ram)
          : ''
      );

      setAgeMonths(
        specs.ageMonths != null
          ? String(specs.ageMonths)
          : ''
      );

      setBatteryHealth(
        specs.batteryHealth != null
          ? String(specs.batteryHealth)
          : ''
      );

      // ----------------------------------------------------------
      // DESCRIPTION
      // ----------------------------------------------------------

      setConditionText(
        listing.conditionText != null
          ? String(listing.conditionText)
          : ''
      );

      // ----------------------------------------------------------
      // EXISTING PHOTOS
      // ----------------------------------------------------------

      const existingPhotos =
        Array.isArray(listing.photos)
          ? listing.photos.filter(Boolean)
          : [];

      setPhotos(
        existingPhotos
          .slice(0, MAX_IMAGES)
          .map((uri) => ({
            uri,
            isNew: false,
          }))
      );

      console.log(
        'EXISTING PHOTOS:',
        existingPhotos
      );
    } catch (error) {
      console.log(
        '========================================'
      );

      console.log(
        'LOAD LISTING ERROR:',
        error.response?.data ||
          error.message
      );

      console.log(
        '========================================'
      );

      Alert.alert(
        'Error',
        error.response?.data?.message ||
          'Could not load the listing.'
      );
    } finally {
      setLoadingListing(false);
    }
  }, [editingListingId]);

  // ============================================================
  // LOAD EDIT LISTING
  // ============================================================

  useEffect(() => {
    if (isEditMode) {
      loadListing();
    }
  }, [
    isEditMode,
    loadListing,
  ]);

  // ============================================================
  // PICK IMAGES
  // ============================================================

  const pickImages = async () => {
    try {
      const remaining =
        MAX_IMAGES - photos.length;

      if (remaining <= 0) {
        Alert.alert(
          'Maximum Images',
          `You can upload up to ${MAX_IMAGES} images.`
        );
        return;
      }

      // --------------------------------------------------------
      // PERMISSION
      // --------------------------------------------------------

      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          'Permission Required',
          'Please allow photo access to select product images.',
          [
            {
              text: 'OK',
            },
          ]
        );

        return;
      }

      // --------------------------------------------------------
      // IMAGE PICKER
      // --------------------------------------------------------

      const result =
        await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsMultipleSelection: true,
          selectionLimit: remaining,
          quality: 0.8,
        });

      if (result.canceled) {
        return;
      }

      const assets =
        Array.isArray(result.assets)
          ? result.assets
          : [];

      if (assets.length === 0) {
        return;
      }

      const selectedUris =
        assets
          .map(
            (asset) => asset?.uri
          )
          .filter(Boolean);

      if (selectedUris.length === 0) {
        return;
      }

      // --------------------------------------------------------
      // REMOVE DUPLICATES
      // --------------------------------------------------------

      setPhotos((previous) => {
        const existingUris =
          new Set(
            previous.map(
              (photo) => photo.uri
            )
          );

        const newPhotos =
          selectedUris
            .filter(
              (uri) =>
                !existingUris.has(uri)
            )
            .map((uri) => ({
              uri,
              isNew: true,
            }));

        return [
          ...previous,
          ...newPhotos,
        ].slice(0, MAX_IMAGES);
      });
    } catch (error) {
      console.log(
        'IMAGE PICK ERROR:',
        error
      );

      Alert.alert(
        'Image Error',
        'Could not select the images.'
      );
    }
  };

  // ============================================================
  // REMOVE IMAGE
  // ============================================================

  const removeImage = (index) => {
    setPhotos((previous) =>
      previous.filter(
        (_, imageIndex) =>
          imageIndex !== index
      )
    );
  };

  // ============================================================
  // VALIDATION
  // ============================================================

  const validateForm = () => {
    // ----------------------------------------------------------
    // TITLE
    // ----------------------------------------------------------

    if (!title.trim()) {
      Alert.alert(
        'Missing Title',
        'Please enter the product title.'
      );

      return false;
    }

    // ----------------------------------------------------------
    // CATEGORY
    // ----------------------------------------------------------

    if (!category.trim()) {
      Alert.alert(
        'Missing Category',
        'Please select a category.'
      );

      return false;
    }

    // ----------------------------------------------------------
    // PRICE
    // ----------------------------------------------------------

    if (!sellerPrice.trim()) {
      Alert.alert(
        'Missing Price',
        'Please enter your selling price.'
      );

      return false;
    }

    const price =
      Number(sellerPrice);

    if (
      !Number.isFinite(price) ||
      price <= 0
    ) {
      Alert.alert(
        'Invalid Price',
        'Please enter a valid selling price.'
      );

      return false;
    }

    // ----------------------------------------------------------
    // AGE
    // ----------------------------------------------------------

    if (ageMonths.trim()) {
      const age =
        Number(ageMonths);

      if (
        !Number.isFinite(age) ||
        age < 0
      ) {
        Alert.alert(
          'Invalid Age',
          'Age must be 0 or greater.'
        );

        return false;
      }
    }

    // ----------------------------------------------------------
    // BATTERY
    // ----------------------------------------------------------

    if (batteryHealth.trim()) {
      const battery =
        Number(batteryHealth);

      if (
        !Number.isFinite(battery) ||
        battery < 0 ||
        battery > 100
      ) {
        Alert.alert(
          'Invalid Battery Health',
          'Battery health must be between 0 and 100.'
        );

        return false;
      }
    }

    return true;
  };

  // ============================================================
  // SUBMIT LISTING
  // ============================================================

  const submitListing = async () => {
    if (submitting) {
      return;
    }

    if (!validateForm()) {
      return;
    }

    try {
      setSubmitting(true);

      // ========================================================
      // IMPORTANT
      // ========================================================
      //
      // DO NOT SEND:
      //
      // seller
      // sellerId
      // userId
      //
      // Backend should take seller from JWT.
      //
      // ========================================================

      const photoUris =
        photos
          .map(
            (photo) => photo.uri
          )
          .filter(Boolean);

      const listingData = {
        title: title.trim(),

        category: category.trim(),

        brand: brand.trim(),

        model: model.trim(),

        sellerPrice:
          Number(sellerPrice),

        conditionText:
          conditionText.trim(),

        specs: {
          storage:
            storage.trim(),

          ram:
            ram.trim(),

          ageMonths:
            ageMonths.trim()
              ? Number(ageMonths)
              : null,

          batteryHealth:
            batteryHealth.trim()
              ? Number(
                  batteryHealth
                )
              : null,
        },

        photos: photoUris,
      };

      console.log(
        '========================================'
      );

      console.log(
        isEditMode
          ? 'UPDATING LISTING'
          : 'CREATING LISTING'
      );

      console.log(
        'LISTING ID:',
        editingListingId
      );

      console.log(
        'LISTING DATA:',
        JSON.stringify(
          listingData,
          null,
          2
        )
      );

      console.log(
        '========================================'
      );

      // ========================================================
      // EDIT
      // ========================================================

      if (isEditMode) {
        const response =
          await client.put(
            `/listings/${editingListingId}`,
            listingData
          );

        console.log(
          'UPDATE RESPONSE:',
          response.data
        );

        Alert.alert(
          'Success',
          'Your listing was updated successfully.',
          [
            {
              text: 'OK',
              onPress: () => {
                navigation.goBack();
              },
            },
          ]
        );

        return;
      }

      // ========================================================
      // CREATE
      // ========================================================

      const response =
        await client.post(
          '/listings',
          listingData
        );

      console.log(
        'CREATE RESPONSE:',
        response.data
      );

      const createdListing =
        response.data?.listing ||
        response.data?.data ||
        response.data;

      const newListingId =
        createdListing?._id ||
        createdListing?.id;

      // ========================================================
      // SUCCESS
      // ========================================================

      Alert.alert(
        'Listing Created',
        'Your product has been listed successfully.',
        [
          {
            text: 'OK',
            onPress: () => {
              if (newListingId) {
                navigation.replace(
                  'ListingDetail',
                  {
                    listingId:
                      String(
                        newListingId
                      ),
                  }
                );
              } else {
                navigation.goBack();
              }
            },
          },
        ]
      );
    } catch (error) {
      console.log(
        '========================================'
      );

      console.log(
        'LISTING SUBMIT ERROR'
      );

      console.log(
        'STATUS:',
        error.response?.status
      );

      console.log(
        'SERVER RESPONSE:',
        error.response?.data
      );

      console.log(
        'ERROR MESSAGE:',
        error.message
      );

      console.log(
        '========================================'
      );

      const status =
        error.response?.status;

      const serverMessage =
        error.response?.data?.message;

      // --------------------------------------------------------
      // 401
      // --------------------------------------------------------

      if (status === 401) {
        Alert.alert(
          'Login Required',
          'Your login session has expired. Please login again.'
        );

        return;
      }

      // --------------------------------------------------------
      // 400
      // --------------------------------------------------------

      if (status === 400) {
        Alert.alert(
          'Invalid Listing',
          serverMessage ||
            'Please check the information you entered.'
        );

        return;
      }

      // --------------------------------------------------------
      // 403
      // --------------------------------------------------------

      if (status === 403) {
        Alert.alert(
          'Permission Denied',
          serverMessage ||
            'You do not have permission to perform this action.'
        );

        return;
      }

      // --------------------------------------------------------
      // 404
      // --------------------------------------------------------

      if (status === 404) {
        Alert.alert(
          'Not Found',
          serverMessage ||
            'The listing API endpoint was not found.'
        );

        return;
      }

      // --------------------------------------------------------
      // 500
      // --------------------------------------------------------

      if (status >= 500) {
        Alert.alert(
          'Server Error',
          serverMessage ||
            'The server encountered an error. Please try again.'
        );

        return;
      }

      // --------------------------------------------------------
      // NETWORK ERROR
      // --------------------------------------------------------

      if (
        !error.response ||
        error.code ===
          'ERR_NETWORK'
      ) {
        Alert.alert(
          'Network Error',
          'Could not connect to the backend server. Check your internet connection and backend URL.'
        );

        return;
      }

      // --------------------------------------------------------
      // OTHER
      // --------------------------------------------------------

      Alert.alert(
        isEditMode
          ? 'Update Failed'
          : 'Create Listing Failed',
        serverMessage ||
          error.message ||
          'Something went wrong.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ============================================================
  // LOADING EXISTING LISTING
  // ============================================================

  if (loadingListing) {
    return (
      <View
        style={
          styles.loadingContainer
        }
      >
        <ActivityIndicator
          size="large"
          color="#2563eb"
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
  // MAIN UI
  // ============================================================

  return (
    <KeyboardAvoidingView
      style={
        styles.keyboardContainer
      }
      behavior={
        Platform.OS === 'ios'
          ? 'padding'
          : undefined
      }
    >
      <ScrollView
        style={
          styles.container
        }
        contentContainerStyle={
          styles.contentContainer
        }
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={
          false
        }
      >
        {/* ======================================================
            HEADER
        ====================================================== */}

        <View
          style={
            styles.header
          }
        >
          <Text
            style={
              styles.headerTitle
            }
          >
            {isEditMode
              ? 'Edit Listing'
              : 'Create Listing'}
          </Text>

          <Text
            style={
              styles.headerSubtitle
            }
          >
            {isEditMode
              ? 'Update your product information'
              : 'Sell your used electronics easily'}
          </Text>
        </View>

        {/* ======================================================
            AUTH INFO
        ====================================================== */}

        <View
          style={
            styles.sellerInfo
          }
        >
          <View
            style={
              styles.sellerIcon
            }
          >
            <Ionicons
              name="person"
              size={20}
              color="#2563eb"
            />
          </View>

          <View
            style={
              styles.sellerInfoText
            }
          >
            <Text
              style={
                styles.sellerLabel
              }
            >
              Seller Account
            </Text>

            <Text
              style={
                styles.sellerUser
              }
            >
              Logged-in account
            </Text>
          </View>

          <Ionicons
            name="shield-checkmark"
            size={23}
            color="#16a34a"
          />
        </View>

        {/* ======================================================
            PHOTOS
        ====================================================== */}

        <Text
          style={
            styles.sectionTitle
          }
        >
          Product Photos
        </Text>

        <Text
          style={
            styles.sectionSubtitle
          }
        >
          Add up to {MAX_IMAGES} photos
        </Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={
            false
          }
          style={
            styles.photoScroll
          }
        >
          {photos.map(
            (photo, index) => (
              <View
                key={`${photo.uri}-${index}`}
                style={
                  styles.photoWrapper
                }
              >
                <Image
                  source={{
                    uri: photo.uri,
                  }}
                  style={
                    styles.photo
                  }
                  resizeMode="cover"
                />

                <TouchableOpacity
                  style={
                    styles.removePhoto
                  }
                  onPress={() =>
                    removeImage(
                      index
                    )
                  }
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name="close"
                    size={18}
                    color="#fff"
                  />
                </TouchableOpacity>

                {photo.isNew && (
                  <View
                    style={
                      styles.newPhotoBadge
                    }
                  >
                    <Text
                      style={
                        styles.newPhotoText
                      }
                    >
                      NEW
                    </Text>
                  </View>
                )}
              </View>
            )
          )}

          {photos.length <
            MAX_IMAGES && (
            <TouchableOpacity
              style={
                styles.addPhoto
              }
              onPress={
                pickImages
              }
              activeOpacity={0.8}
            >
              <Ionicons
                name="camera-outline"
                size={31}
                color="#2563eb"
              />

              <Text
                style={
                  styles.addPhotoText
                }
              >
                Add Photos
              </Text>
            </TouchableOpacity>
          )}
        </ScrollView>

        {/* ======================================================
            PRODUCT DETAILS
        ====================================================== */}

        <Text
          style={
            styles.sectionTitle
          }
        >
          Product Details
        </Text>

        <InputField
          label="Product Title *"
          placeholder="Example: iPhone 14 Pro 256GB"
          value={title}
          onChangeText={
            setTitle
          }
        />

        {/* ======================================================
            CATEGORY
        ====================================================== */}

        <Text
          style={
            styles.inputLabel
          }
        >
          Category *
        </Text>

        <View
          style={
            styles.categoryContainer
          }
        >
          {CATEGORIES.map(
            (item) => {
              const selected =
                category ===
                item;

              return (
                <TouchableOpacity
                  key={item}
                  style={[
                    styles.categoryButton,
                    selected &&
                      styles.categoryButtonSelected,
                  ]}
                  onPress={() =>
                    setCategory(
                      item
                    )
                  }
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.categoryText,
                      selected &&
                        styles.categoryTextSelected,
                    ]}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              );
            }
          )}
        </View>

        {/* ======================================================
            BRAND
        ====================================================== */}

        <InputField
          label="Brand"
          placeholder="Example: Apple"
          value={brand}
          onChangeText={
            setBrand
          }
        />

        {/* ======================================================
            MODEL
        ====================================================== */}

        <InputField
          label="Model"
          placeholder="Example: iPhone 14 Pro"
          value={model}
          onChangeText={
            setModel
          }
        />

        {/* ======================================================
            PRICE
        ====================================================== */}

        <InputField
          label="Selling Price *"
          placeholder="Example: 45000"
          value={sellerPrice}
          onChangeText={
            setSellerPrice
          }
          keyboardType="numeric"
          prefix="₹"
        />

        {/* ======================================================
            SPECIFICATIONS
        ====================================================== */}

        <Text
          style={
            styles.sectionTitle
          }
        >
          Specifications
        </Text>

        <InputField
          label="Storage"
          placeholder="Example: 256GB"
          value={storage}
          onChangeText={
            setStorage
          }
        />

        <InputField
          label="RAM"
          placeholder="Example: 8GB"
          value={ram}
          onChangeText={
            setRam
          }
        />

        <InputField
          label="Age"
          placeholder="Example: 18"
          value={ageMonths}
          onChangeText={
            setAgeMonths
          }
          keyboardType="numeric"
          suffix="months"
        />

        <InputField
          label="Battery Health"
          placeholder="Example: 87"
          value={
            batteryHealth
          }
          onChangeText={
            setBatteryHealth
          }
          keyboardType="numeric"
          suffix="%"
        />

        {/* ======================================================
            DESCRIPTION
        ====================================================== */}

        <Text
          style={
            styles.inputLabel
          }
        >
          Seller Description
        </Text>

        <TextInput
          style={
            styles.textArea
          }
          placeholder="Describe condition, accessories, warranty, etc."
          placeholderTextColor="#94a3b8"
          value={
            conditionText
          }
          onChangeText={
            setConditionText
          }
          multiline
          textAlignVertical="top"
          maxLength={2000}
        />

        {/* ======================================================
            AUTH INFORMATION
        ====================================================== */}

        <View
          style={
            styles.infoBox
          }
        >
          <Ionicons
            name="information-circle-outline"
            size={21}
            color="#2563eb"
          />

          <Text
            style={
              styles.infoText
            }
          >
            Your seller account is automatically
            identified using your login token.
            You do not need to enter a seller ID.
          </Text>
        </View>

        {/* ======================================================
            SUBMIT
        ====================================================== */}

        <TouchableOpacity
          style={[
            styles.submitButton,
            submitting &&
              styles.disabledButton,
          ]}
          onPress={
            submitListing
          }
          disabled={
            submitting
          }
          activeOpacity={0.8}
        >
          {submitting ? (
            <>
              <ActivityIndicator
                size="small"
                color="#fff"
              />

              <Text
                style={
                  styles.submitText
                }
              >
                {isEditMode
                  ? 'Updating...'
                  : 'Creating...'}
              </Text>
            </>
          ) : (
            <>
              <Ionicons
                name={
                  isEditMode
                    ? 'save-outline'
                    : 'add-circle-outline'
                }
                size={23}
                color="#fff"
              />

              <Text
                style={
                  styles.submitText
                }
              >
                {isEditMode
                  ? 'Update Listing'
                  : 'Create Listing'}
              </Text>
            </>
          )}
        </TouchableOpacity>

        <View
          style={
            styles.bottomSpace
          }
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ============================================================
// INPUT FIELD
// ============================================================

function InputField({
  label,
  placeholder,
  value,
  onChangeText,
  keyboardType,
  prefix,
  suffix,
}) {
  return (
    <View
      style={
        styles.inputContainer
      }
    >
      <Text
        style={
          styles.inputLabel
        }
      >
        {label}
      </Text>

      <View
        style={
          styles.inputWrapper
        }
      >
        {prefix && (
          <Text
            style={
              styles.prefix
            }
          >
            {prefix}
          </Text>
        )}

        <TextInput
          style={[
            styles.input,
            prefix &&
              styles.inputWithPrefix,
          ]}
          placeholder={
            placeholder
          }
          placeholderTextColor="#94a3b8"
          value={value}
          onChangeText={
            onChangeText
          }
          keyboardType={
            keyboardType ||
            'default'
          }
          autoCapitalize="sentences"
        />

        {suffix && (
          <Text
            style={
              styles.suffix
            }
          >
            {suffix}
          </Text>
        )}
      </View>
    </View>
  );
}

// ============================================================
// STYLES
// ============================================================

const styles =
  StyleSheet.create({
    keyboardContainer: {
      flex: 1,
      backgroundColor:
        '#f8fafc',
    },

    container: {
      flex: 1,
      backgroundColor:
        '#f8fafc',
    },

    contentContainer: {
      padding: 16,
      paddingBottom: 40,
    },

    // ========================================================
    // LOADING
    // ========================================================

    loadingContainer: {
      flex: 1,
      justifyContent:
        'center',
      alignItems:
        'center',
      backgroundColor:
        '#f8fafc',
    },

    loadingText: {
      marginTop: 12,
      color: '#64748b',
      fontSize: 15,
    },

    // ========================================================
    // HEADER
    // ========================================================

    header: {
      marginBottom: 18,
    },

    headerTitle: {
      fontSize: 27,
      fontWeight: '900',
      color: '#111827',
    },

    headerSubtitle: {
      marginTop: 5,
      color: '#64748b',
      fontSize: 14,
    },

    // ========================================================
    // SELLER
    // ========================================================

    sellerInfo: {
      flexDirection:
        'row',
      alignItems:
        'center',
      backgroundColor:
        '#eff6ff',
      borderWidth: 1,
      borderColor:
        '#bfdbfe',
      borderRadius: 14,
      padding: 13,
      marginBottom: 22,
    },

    sellerIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor:
        '#dbeafe',
      alignItems:
        'center',
      justifyContent:
        'center',
      marginRight: 11,
    },

    sellerInfoText: {
      flex: 1,
    },

    sellerLabel: {
      color: '#64748b',
      fontSize: 12,
    },

    sellerUser: {
      color: '#111827',
      fontSize: 14,
      fontWeight: '800',
      marginTop: 2,
    },

    // ========================================================
    // SECTIONS
    // ========================================================

    sectionTitle: {
      fontSize: 19,
      fontWeight: '900',
      color: '#111827',
      marginTop: 8,
      marginBottom: 4,
    },

    sectionSubtitle: {
      color: '#64748b',
      fontSize: 13,
      marginBottom: 10,
    },

    // ========================================================
    // PHOTOS
    // ========================================================

    photoScroll: {
      marginBottom: 15,
    },

    photoWrapper: {
      width: 110,
      height: 110,
      borderRadius: 12,
      marginRight: 10,
      overflow: 'hidden',
      backgroundColor:
        '#e2e8f0',
      position: 'relative',
    },

    photo: {
      width: '100%',
      height: '100%',
    },

    removePhoto: {
      position: 'absolute',
      right: 5,
      top: 5,
      width: 27,
      height: 27,
      borderRadius: 14,
      backgroundColor:
        'rgba(220,38,38,0.92)',
      alignItems:
        'center',
      justifyContent:
        'center',
    },

    newPhotoBadge: {
      position: 'absolute',
      left: 5,
      bottom: 5,
      backgroundColor:
        '#16a34a',
      borderRadius: 5,
      paddingHorizontal: 6,
      paddingVertical: 3,
    },

    newPhotoText: {
      color: '#fff',
      fontSize: 8,
      fontWeight: '900',
    },

    addPhoto: {
      width: 110,
      height: 110,
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor:
        '#93c5fd',
      borderStyle: 'dashed',
      backgroundColor:
        '#eff6ff',
      alignItems:
        'center',
      justifyContent:
        'center',
    },

    addPhotoText: {
      color: '#2563eb',
      fontWeight: '700',
      fontSize: 12,
      marginTop: 6,
    },

    // ========================================================
    // INPUTS
    // ========================================================

    inputContainer: {
      marginTop: 15,
    },

    inputLabel: {
      fontSize: 14,
      fontWeight: '800',
      color: '#334155',
      marginBottom: 7,
    },

    inputWrapper: {
      minHeight: 50,
      flexDirection:
        'row',
      alignItems:
        'center',
      backgroundColor:
        '#fff',
      borderWidth: 1,
      borderColor:
        '#cbd5e1',
      borderRadius: 11,
    },

    input: {
      flex: 1,
      minHeight: 48,
      paddingHorizontal: 13,
      color: '#111827',
      fontSize: 15,
    },

    inputWithPrefix: {
      paddingLeft: 4,
    },

    prefix: {
      color: '#334155',
      fontSize: 16,
      fontWeight: '800',
      marginLeft: 13,
    },

    suffix: {
      color: '#64748b',
      fontSize: 13,
      fontWeight: '700',
      marginRight: 13,
    },

    // ========================================================
    // CATEGORY
    // ========================================================

    categoryContainer: {
      flexDirection:
        'row',
      flexWrap:
        'wrap',
      marginTop: 5,
    },

    categoryButton: {
      paddingHorizontal: 13,
      paddingVertical: 9,
      borderRadius: 20,
      borderWidth: 1,
      borderColor:
        '#cbd5e1',
      backgroundColor:
        '#fff',
      marginRight: 8,
      marginBottom: 8,
    },

    categoryButtonSelected: {
      backgroundColor:
        '#2563eb',
      borderColor:
        '#2563eb',
    },

    categoryText: {
      color: '#475569',
      fontSize: 13,
      fontWeight: '700',
    },

    categoryTextSelected: {
      color: '#fff',
    },

    // ========================================================
    // DESCRIPTION
    // ========================================================

    textArea: {
      minHeight: 130,
      backgroundColor:
        '#fff',
      borderWidth: 1,
      borderColor:
        '#cbd5e1',
      borderRadius: 11,
      padding: 13,
      color: '#111827',
      fontSize: 15,
    },

    // ========================================================
    // INFO
    // ========================================================

    infoBox: {
      flexDirection:
        'row',
      alignItems:
        'flex-start',
      backgroundColor:
        '#eff6ff',
      borderWidth: 1,
      borderColor:
        '#bfdbfe',
      borderRadius: 11,
      padding: 12,
      marginTop: 18,
    },

    infoText: {
      flex: 1,
      color: '#1e40af',
      fontSize: 13,
      lineHeight: 19,
      fontWeight: '600',
      marginLeft: 9,
    },

    // ========================================================
    // SUBMIT
    // ========================================================

    submitButton: {
      minHeight: 56,
      flexDirection:
        'row',
      alignItems:
        'center',
      justifyContent:
        'center',
      backgroundColor:
        '#2563eb',
      borderRadius: 13,
      marginTop: 22,
    },

    disabledButton: {
      opacity: 0.55,
    },

    submitText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '900',
      marginLeft: 9,
    },

    bottomSpace: {
      height: 20,
    },
  });
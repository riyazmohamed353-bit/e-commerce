import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import client from '../api/client';

export default function MyListingsScreen({ navigation }) {
  const [listings, setListings] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  // Tracks which listing has a request in flight (sold / unsold /
  // delete), so we can show a spinner on just that card's button
  // and prevent double-taps.
  const [busyId, setBusyId] = useState(null);
  const [busyAction, setBusyAction] = useState(null); // 'sold' | 'unsold' | 'delete'

  const loadListings = async () => {
    try {
      const { data } = await client.get('/listings/my-listings');
      setListings(Array.isArray(data?.listings) ? data.listings : []);
    } catch (err) {
      console.log('MY LISTINGS ERROR:', err);
      Alert.alert(
        'Error',
        err.response?.data?.message || 'Could not load your listings'
      );
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadListings();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadListings();
    setRefreshing(false);
  };

  // ==========================================
  // MARK AS SOLD
  // PATCH /listings/:id/sold
  // ==========================================

  const confirmMarkAsSold = (listing) => {
    Alert.alert(
      'Mark as sold?',
      `Mark "${listing.title}" as sold? Buyers won't be able to find it in the Marketplace anymore.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mark as Sold',
          style: 'destructive',
          onPress: () => markAsSold(listing._id),
        },
      ]
    );
  };

  const markAsSold = async (listingId) => {
    try {
      setBusyId(listingId);
      setBusyAction('sold');

      const { data } = await client.patch(
        `/listings/${listingId}/sold`
      );

      const updated = data?.listing;

      setListings((previous) =>
        previous.map((item) =>
          item._id === listingId
            ? { ...item, status: 'sold', ...(updated || {}) }
            : item
        )
      );
    } catch (err) {
      console.log('MARK AS SOLD ERROR:', err);
      Alert.alert(
        'Error',
        err.response?.data?.message ||
          'Could not mark this listing as sold'
      );
    } finally {
      setBusyId(null);
      setBusyAction(null);
    }
  };

  // ==========================================
  // UNMARK AS SOLD
  // PATCH /listings/:id/unsold
  // ==========================================

  const confirmUnmarkAsSold = (listing) => {
    Alert.alert(
      'Relist this item?',
      `Mark "${listing.title}" as active again? It will reappear in the Marketplace.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Relist',
          onPress: () => unmarkAsSold(listing._id),
        },
      ]
    );
  };

  const unmarkAsSold = async (listingId) => {
    try {
      setBusyId(listingId);
      setBusyAction('unsold');

      const { data } = await client.patch(
        `/listings/${listingId}/unsold`
      );

      const updated = data?.listing;

      setListings((previous) =>
        previous.map((item) =>
          item._id === listingId
            ? { ...item, status: 'active', ...(updated || {}) }
            : item
        )
      );
    } catch (err) {
      console.log('UNMARK AS SOLD ERROR:', err);
      Alert.alert(
        'Error',
        err.response?.data?.message ||
          'Could not relist this listing'
      );
    } finally {
      setBusyId(null);
      setBusyAction(null);
    }
  };

  // ==========================================
  // DELETE LISTING
  // DELETE /listings/:id
  // ==========================================

  const confirmDelete = (listing) => {
    Alert.alert(
      'Delete this listing?',
      `"${listing.title}" will be permanently removed from the Marketplace. This can't be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteListing(listing._id),
        },
      ]
    );
  };

  const deleteListing = async (listingId) => {
    try {
      setBusyId(listingId);
      setBusyAction('delete');

      await client.delete(`/listings/${listingId}`);

      // Backend soft-deletes (status: 'removed') rather than
      // actually deleting the document, but from this screen's
      // point of view the listing should just disappear.
      setListings((previous) =>
        previous.filter((item) => item._id !== listingId)
      );
    } catch (err) {
      console.log('DELETE LISTING ERROR:', err);
      Alert.alert(
        'Error',
        err.response?.data?.message ||
          'Could not delete this listing'
      );
    } finally {
      setBusyId(null);
      setBusyAction(null);
    }
  };

  const getStatusStyle = (status) => {
    if (status === 'sold') {
      return styles.soldBadge;
    }

    if (status === 'removed') {
      return styles.removedBadge;
    }

    return styles.activeBadge;
  };

  const getStatusTextStyle = (status) => {
    if (status === 'sold') {
      return styles.soldText;
    }

    if (status === 'removed') {
      return styles.removedText;
    }

    return styles.activeText;
  };

  const renderItem = ({ item }) => {
    const isBusy = busyId === item._id;
    const isActive = item.status === 'active';
    const isSold = item.status === 'sold';

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.8}
        onPress={() =>
          navigation.navigate('ListingDetail', {
            listingId: item._id,
          })
        }
      >
        {/* IMAGE */}
        <View style={styles.imageBox}>
          <Text style={styles.imageIcon}>📱</Text>
        </View>

        {/* CONTENT */}
        <View style={styles.cardContent}>
          <Text style={styles.title} numberOfLines={1}>
            {item.title}
          </Text>

          <Text style={styles.brand}>
            {item.brand || 'Unknown brand'}
            {item.model ? ` • ${item.model}` : ''}
          </Text>

          <Text style={styles.price}>
            ₹{Number(item.sellerPrice || 0).toLocaleString('en-IN')}
          </Text>

          <View style={styles.bottomRow}>
            <View style={getStatusStyle(item.status)}>
              <Text style={getStatusTextStyle(item.status)}>
                {item.status === 'sold'
                  ? 'SOLD'
                  : item.status === 'removed'
                  ? 'REMOVED'
                  : 'ACTIVE'}
              </Text>
            </View>

            <Text style={styles.category}>
              {item.category || 'Electronics'}
            </Text>
          </View>

          {/* ACTIONS */}
          <View style={styles.actionsRow}>

            {isActive && (
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  styles.soldButton,
                  isBusy && styles.actionButtonDisabled,
                ]}
                disabled={isBusy}
                onPress={(e) => {
                  e.stopPropagation();
                  confirmMarkAsSold(item);
                }}
              >
                {isBusy && busyAction === 'sold' ? (
                  <ActivityIndicator size="small" color="#2563eb" />
                ) : (
                  <Text style={styles.soldButtonText}>
                    Mark as Sold
                  </Text>
                )}
              </TouchableOpacity>
            )}

            {isSold && (
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  styles.unsoldButton,
                  isBusy && styles.actionButtonDisabled,
                ]}
                disabled={isBusy}
                onPress={(e) => {
                  e.stopPropagation();
                  confirmUnmarkAsSold(item);
                }}
              >
                {isBusy && busyAction === 'unsold' ? (
                  <ActivityIndicator size="small" color="#15803d" />
                ) : (
                  <Text style={styles.unsoldButtonText}>
                    Relist
                  </Text>
                )}
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[
                styles.actionButton,
                styles.deleteButton,
                isBusy && styles.actionButtonDisabled,
              ]}
              disabled={isBusy}
              onPress={(e) => {
                e.stopPropagation();
                confirmDelete(item);
              }}
            >
              {isBusy && busyAction === 'delete' ? (
                <ActivityIndicator size="small" color="#dc2626" />
              ) : (
                <Text style={styles.deleteButtonText}>
                  Delete
                </Text>
              )}
            </TouchableOpacity>

          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Listings</Text>
        <Text style={styles.headerSubtitle}>
          Manage the products you are selling
        </Text>
      </View>

      <FlatList
        data={listings}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
          />
        }
        contentContainerStyle={
          listings.length === 0
            ? styles.emptyContainer
            : styles.listContainer
        }
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptyIcon}>📦</Text>

            <Text style={styles.emptyTitle}>
              No listings yet
            </Text>

            <Text style={styles.emptyText}>
              Products you sell will appear here.
            </Text>

            <TouchableOpacity
              style={styles.sellButton}
              onPress={() =>
                navigation.navigate('Tabs', {
                  screen: 'CreateListing',
                })
              }
            >
              <Text style={styles.sellButtonText}>
                Sell a Device
              </Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },

  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 14,
    backgroundColor: '#ffffff',
  },

  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
  },

  headerSubtitle: {
    marginTop: 4,
    fontSize: 14,
    color: '#64748b',
  },

  listContainer: {
    padding: 16,
    paddingBottom: 40,
  },

  card: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    marginBottom: 12,
    padding: 12,

    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 5,
    shadowOffset: {
      width: 0,
      height: 2,
    },

    elevation: 2,
  },

  imageBox: {
    width: 90,
    height: 90,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },

  imageIcon: {
    fontSize: 34,
  },

  cardContent: {
    flex: 1,
    marginLeft: 14,
    justifyContent: 'center',
  },

  title: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
  },

  brand: {
    marginTop: 4,
    fontSize: 13,
    color: '#64748b',
  },

  price: {
    marginTop: 7,
    fontSize: 18,
    fontWeight: '800',
    color: '#2563eb',
  },

  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },

  activeBadge: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 20,
  },

  soldBadge: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 20,
  },

  removedBadge: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 20,
  },

  activeText: {
    color: '#15803d',
    fontSize: 11,
    fontWeight: '800',
  },

  soldText: {
    color: '#b45309',
    fontSize: 11,
    fontWeight: '800',
  },

  removedText: {
    color: '#dc2626',
    fontSize: 11,
    fontWeight: '800',
  },

  category: {
    fontSize: 12,
    color: '#64748b',
    textTransform: 'capitalize',
  },

  // ACTIONS

  actionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },

  actionButton: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    minWidth: 88,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },

  actionButtonDisabled: {
    opacity: 0.6,
  },

  soldButton: {
    backgroundColor: '#eff6ff',
    borderColor: '#bfdbfe',
  },

  soldButtonText: {
    color: '#2563eb',
    fontWeight: '700',
    fontSize: 12,
  },

  unsoldButton: {
    backgroundColor: '#f0fdf4',
    borderColor: '#bbf7d0',
  },

  unsoldButtonText: {
    color: '#15803d',
    fontWeight: '700',
    fontSize: 12,
  },

  deleteButton: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
  },

  deleteButtonText: {
    color: '#dc2626',
    fontWeight: '700',
    fontSize: 12,
  },

  emptyContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 30,
  },

  emptyBox: {
    alignItems: 'center',
  },

  emptyIcon: {
    fontSize: 55,
    marginBottom: 15,
  },

  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
  },

  emptyText: {
    marginTop: 6,
    color: '#64748b',
    textAlign: 'center',
  },

  sellButton: {
    marginTop: 20,
    backgroundColor: '#2563eb',
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 10,
  },

  sellButtonText: {
    color: '#ffffff',
    fontWeight: '700',
  },
});
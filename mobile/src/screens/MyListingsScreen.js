import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import client from '../api/client';

export default function MyListingsScreen({ navigation }) {
  const [listings, setListings] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadListings = async () => {
    try {
      const { data } = await client.get('/listings/mine');
      setListings(Array.isArray(data) ? data : []);
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
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Modal,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import ListingCard from '../components/ListingCard';

import {
  colors,
  spacing,
  radius,
  typography,
  shadow,
} from '../theme/theme';


// ============================================================
// FILTER OPTIONS
//
// FIX: keys must match the Listing model's category enum exactly
// ('Mobile', 'Laptop', etc.) since the backend does a plain
// equality match (filter.category = category) with no case
// normalization. Lowercase keys like 'phone' never matched
// anything, so category filtering silently returned zero results.
// ============================================================

const CATEGORIES = [
  { key: '', label: 'All' },
  { key: 'Mobile', label: 'Phones' },
  { key: 'Laptop', label: 'Laptops' },
  { key: 'Tablet', label: 'Tablets' },
  { key: 'Smartwatch', label: 'Smartwatches' },
  { key: 'Camera', label: 'Cameras' },
  { key: 'Other', label: 'Other' },
];

const RAM_OPTIONS = [
  { value: '', label: 'Any RAM' },
  { value: '4', label: '4 GB+' },
  { value: '6', label: '6 GB+' },
  { value: '8', label: '8 GB+' },
  { value: '12', label: '12 GB+' },
  { value: '16', label: '16 GB+' },
];


// ============================================================
// SMALL COMPONENTS
// ============================================================

function FilterChip({ label, active, onPress }) {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={[
        styles.filterChip,
        active && styles.filterChipActive,
      ]}
    >
      {active && (
        <Ionicons
          name="checkmark"
          size={15}
          color={colors.white}
        />
      )}

      <Text
        style={[
          styles.filterChipText,
          active && styles.filterChipTextActive,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}


function SectionTitle({ icon, title }) {
  return (
    <View style={styles.sectionTitleRow}>
      <Ionicons
        name={icon}
        size={18}
        color={colors.primary}
      />

      <Text style={styles.sectionTitle}>
        {title}
      </Text>
    </View>
  );
}


// ============================================================
// HOME SCREEN
// ============================================================

export default function HomeScreen({ navigation }) {
  const { user } = useAuth();

  // ----------------------------------------------------------
  // Listings
  // ----------------------------------------------------------

  const [listings, setListings] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  // ----------------------------------------------------------
  // Search
  // ----------------------------------------------------------

  const [searchText, setSearchText] = useState('');
  const [activeSearch, setActiveSearch] = useState('');

  // ----------------------------------------------------------
  // Filter modal
  // ----------------------------------------------------------

  const [filterVisible, setFilterVisible] = useState(false);

  // ----------------------------------------------------------
  // Active filters
  // ----------------------------------------------------------

  const [category, setCategory] = useState('');
  const [brand, setBrand] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [ram, setRam] = useState('');
  const [pincode, setPincode] = useState('');

  // ----------------------------------------------------------
  // Temporary filters
  // These are used while the filter modal is open.
  // ----------------------------------------------------------

  const [tempCategory, setTempCategory] = useState('');
  const [tempBrand, setTempBrand] = useState('');
  const [tempMinPrice, setTempMinPrice] = useState('');
  const [tempMaxPrice, setTempMaxPrice] = useState('');
  const [tempRam, setTempRam] = useState('');
  const [tempPincode, setTempPincode] = useState('');

  // ==========================================================
  // LOAD LISTINGS
  // ==========================================================

  const loadListings = useCallback(
    async (customFilters = null) => {
      try {
        setLoading(true);

        const filters = customFilters || {
          q: activeSearch,
          category,
          brand,
          minPrice,
          maxPrice,
          minRam: ram,
          pincode,
        };

        const params = {};

        if (filters.q?.trim()) {
          params.q = filters.q.trim();
        }

        if (filters.category) {
          params.category = filters.category;
        }

        if (filters.brand?.trim()) {
          params.brand = filters.brand.trim();
        }

        if (filters.minPrice) {
          params.minPrice = filters.minPrice;
        }

        if (filters.maxPrice) {
          params.maxPrice = filters.maxPrice;
        }

        if (filters.minRam) {
          params.minRam = filters.minRam;
        }

        if (filters.pincode) {
          params.pincode = filters.pincode;
        }

        const { data } = await client.get('/listings', {
          params,
        });

        // FIX: listingController responds with
        // { success, count, listings } instead of a bare array.
        // Array.isArray(data) was always false, so this silently
        // emptied the Marketplace on every load regardless of
        // what was actually in the database.
        setListings(
          Array.isArray(data?.listings) ? data.listings : []
        );
      } catch (err) {
        console.warn(
          'Failed to load listings:',
          err.response?.data?.message || err.message
        );

        setListings([]);
      } finally {
        setLoading(false);
      }
    },
    [
      activeSearch,
      category,
      brand,
      minPrice,
      maxPrice,
      ram,
      pincode,
    ]
  );


  // ==========================================================
  // INITIAL LOAD
  // ==========================================================

  useEffect(() => {
    const initialPincode = user?.pincode || '';

    setPincode(initialPincode);
    setTempPincode(initialPincode);

    loadListings({
      q: '',
      category: '',
      brand: '',
      minPrice: '',
      maxPrice: '',
      minRam: '',
      pincode: initialPincode,
    });
  }, [user?.pincode]);


  // ==========================================================
  // SEARCH
  // ==========================================================

  const performSearch = () => {
    const value = searchText.trim();

    setActiveSearch(value);

    loadListings({
      q: value,
      category,
      brand,
      minPrice,
      maxPrice,
      minRam: ram,
      pincode,
    });
  };


  // ==========================================================
  // OPEN FILTER
  // ==========================================================

  const openFilters = () => {
    setTempCategory(category);
    setTempBrand(brand);
    setTempMinPrice(minPrice);
    setTempMaxPrice(maxPrice);
    setTempRam(ram);
    setTempPincode(pincode);

    setFilterVisible(true);
  };


  // ==========================================================
  // APPLY FILTERS
  // ==========================================================

  const applyFilters = () => {
    if (
      tempMinPrice &&
      tempMaxPrice &&
      Number(tempMinPrice) > Number(tempMaxPrice)
    ) {
      return;
    }

    if (
      tempPincode &&
      !/^\d{3,6}$/.test(tempPincode)
    ) {
      return;
    }

    const newFilters = {
      q: activeSearch,
      category: tempCategory,
      brand: tempBrand,
      minPrice: tempMinPrice,
      maxPrice: tempMaxPrice,
      minRam: tempRam,
      pincode: tempPincode,
    };

    setCategory(tempCategory);
    setBrand(tempBrand);
    setMinPrice(tempMinPrice);
    setMaxPrice(tempMaxPrice);
    setRam(tempRam);
    setPincode(tempPincode);

    setFilterVisible(false);

    loadListings(newFilters);
  };


  // ==========================================================
  // RESET FILTERS
  // ==========================================================

  const resetFilters = () => {
    setTempCategory('');
    setTempBrand('');
    setTempMinPrice('');
    setTempMaxPrice('');
    setTempRam('');
    setTempPincode('');

    setCategory('');
    setBrand('');
    setMinPrice('');
    setMaxPrice('');
    setRam('');
    setPincode('');

    setSearchText('');
    setActiveSearch('');

    setFilterVisible(false);

    loadListings({
      q: '',
      category: '',
      brand: '',
      minPrice: '',
      maxPrice: '',
      minRam: '',
      pincode: '',
    });
  };


  // ==========================================================
  // REFRESH
  // ==========================================================

  const onRefresh = async () => {
    setRefreshing(true);

    await loadListings();

    setRefreshing(false);
  };


  // ==========================================================
  // FILTER COUNT
  // ==========================================================

  const activeFilterCount = useMemo(() => {
    let count = 0;

    if (category) count++;
    if (brand) count++;
    if (minPrice) count++;
    if (maxPrice) count++;
    if (ram) count++;
    if (pincode) count++;

    return count;
  }, [
    category,
    brand,
    minPrice,
    maxPrice,
    ram,
    pincode,
  ]);


  // ==========================================================
  // RESULT TEXT
  // ==========================================================

  const resultText = useMemo(() => {
    if (loading) return 'Finding listings...';

    if (listings.length === 0) {
      return 'No listings found';
    }

    return `${listings.length} ${
      listings.length === 1 ? 'listing' : 'listings'
    } found`;
  }, [listings.length, loading]);


  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <SafeAreaView style={styles.container}>

      {/* ====================================================
          HEADER
      ==================================================== */}

      <View style={styles.header}>

        <View>
          <Text style={styles.smallHeaderText}>
            Used electronics
          </Text>

          <Text style={typography.h1}>
            Marketplace
          </Text>
        </View>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => navigation.navigate('Profile')}
          style={styles.profileButton}
        >
          <Ionicons
            name="person-outline"
            size={20}
            color={colors.primary}
          />
        </TouchableOpacity>

      </View>


      {/* ====================================================
          SEARCH BAR
      ==================================================== */}

      <View style={styles.searchContainer}>

        <Ionicons
          name="search-outline"
          size={21}
          color={colors.textMuted}
        />

        <TextInput
          value={searchText}
          onChangeText={setSearchText}
          onSubmitEditing={performSearch}
          returnKeyType="search"
          placeholder="Search phones, laptops, models..."
          placeholderTextColor={colors.textMuted}
          style={styles.searchInput}
        />

        {searchText.length > 0 && (
          <TouchableOpacity
            onPress={() => {
              setSearchText('');
              setActiveSearch('');

              loadListings({
                q: '',
                category,
                brand,
                minPrice,
                maxPrice,
                minRam: ram,
                pincode,
              });
            }}
          >
            <Ionicons
              name="close-circle"
              size={20}
              color={colors.textMuted}
            />
          </TouchableOpacity>
        )}

        <TouchableOpacity
          onPress={performSearch}
          style={styles.searchButton}
        >
          <Ionicons
            name="arrow-forward"
            size={18}
            color={colors.white}
          />
        </TouchableOpacity>

      </View>


      {/* ====================================================
          FILTER BUTTON
      ==================================================== */}

      <View style={styles.filterRow}>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={openFilters}
          style={styles.filterButton}
        >
          <Ionicons
            name="options-outline"
            size={19}
            color={colors.primary}
          />

          <Text style={styles.filterButtonText}>
            Filters
          </Text>

          {activeFilterCount > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>
                {activeFilterCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>


        {activeFilterCount > 0 && (
          <TouchableOpacity
            onPress={resetFilters}
            style={styles.clearButton}
          >
            <Text style={styles.clearButtonText}>
              Clear all
            </Text>
          </TouchableOpacity>
        )}

      </View>


      {/* ====================================================
          ACTIVE FILTERS
      ==================================================== */}

      {activeFilterCount > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.activeFiltersScroll}
          contentContainerStyle={styles.activeFilters}
        >

          {category ? (
            <View style={styles.activeChip}>
              <Text style={styles.activeChipText}>
                {category}
              </Text>
            </View>
          ) : null}

          {brand ? (
            <View style={styles.activeChip}>
              <Text style={styles.activeChipText}>
                {brand}
              </Text>
            </View>
          ) : null}

          {minPrice || maxPrice ? (
            <View style={styles.activeChip}>
              <Text style={styles.activeChipText}>
                ₹{minPrice || '0'} - ₹{maxPrice || '∞'}
              </Text>
            </View>
          ) : null}

          {ram ? (
            <View style={styles.activeChip}>
              <Text style={styles.activeChipText}>
                {ram}GB+ RAM
              </Text>
            </View>
          ) : null}

          {pincode ? (
            <View style={styles.activeChip}>
              <Text style={styles.activeChipText}>
                📍 {pincode}
              </Text>
            </View>
          ) : null}

        </ScrollView>
      )}


      {/* ====================================================
          RESULTS
      ==================================================== */}

      <View style={styles.resultHeader}>
        <Text style={styles.resultText}>
          {resultText}
        </Text>

        {activeSearch ? (
          <Text style={styles.searchResultText}>
            for "{activeSearch}"
          </Text>
        ) : null}
      </View>


      {/* ====================================================
          LISTINGS
      ==================================================== */}

      <FlatList
        data={listings}
        keyExtractor={(item) => item._id}
        showsVerticalScrollIndicator={false}

        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
          />
        }

        contentContainerStyle={[
          styles.listContent,
          listings.length === 0 && styles.emptyList,
        ]}

        renderItem={({ item }) => (
          <ListingCard
            listing={item}
            onPress={() =>
              navigation.navigate(
                'ListingDetail',
                {
                  listingId: item._id,
                }
              )
            }
          />
        )}

        ListEmptyComponent={
          loading ? (
            <View style={styles.emptyContainer}>
              <ActivityIndicator
                size="large"
                color={colors.primary}
              />

              <Text style={styles.emptyTitle}>
                Finding the best listings...
              </Text>
            </View>
          ) : (
            <View style={styles.emptyContainer}>

              <View style={styles.emptyIcon}>
                <Ionicons
                  name="search-outline"
                  size={35}
                  color={colors.primary}
                />
              </View>

              <Text style={styles.emptyTitle}>
                No listings found
              </Text>

              <Text style={styles.emptyText}>
                Try changing your filters or search for another device.
              </Text>

              <TouchableOpacity
                onPress={resetFilters}
                style={styles.resetButton}
              >
                <Text style={styles.resetButtonText}>
                  Reset Filters
                </Text>
              </TouchableOpacity>

            </View>
          )
        }
      />


      {/* ====================================================
          FILTER MODAL
      ==================================================== */}

      <Modal
        visible={filterVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setFilterVisible(false)}
      >

        <SafeAreaView style={styles.modalContainer}>

          {/* MODAL HEADER */}

          <View style={styles.modalHeader}>

            <TouchableOpacity
              onPress={() => setFilterVisible(false)}
              style={styles.modalCloseButton}
            >
              <Ionicons
                name="close"
                size={24}
                color={colors.textPrimary}
              />
            </TouchableOpacity>

            <Text style={styles.modalTitle}>
              Filters
            </Text>

            <TouchableOpacity
              onPress={() => {
                setTempCategory('');
                setTempBrand('');
                setTempMinPrice('');
                setTempMaxPrice('');
                setTempRam('');
                setTempPincode('');
              }}
            >
              <Text style={styles.modalReset}>
                Reset
              </Text>
            </TouchableOpacity>

          </View>


          {/* FILTER CONTENT */}

          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={
              Platform.OS === 'ios'
                ? 'padding'
                : undefined
            }
          >

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.modalContent}
              keyboardShouldPersistTaps="handled"
            >

              {/* CATEGORY */}

              <SectionTitle
                icon="grid-outline"
                title="Category"
              />

              <View style={styles.chipContainer}>

                {CATEGORIES.map((item) => (
                  <FilterChip
                    key={item.key || 'all'}
                    label={item.label}
                    active={tempCategory === item.key}
                    onPress={() =>
                      setTempCategory(item.key)
                    }
                  />
                ))}

              </View>


              {/* PRICE */}

              <SectionTitle
                icon="cash-outline"
                title="Price range"
              />

              <View style={styles.priceRow}>

                <View style={styles.priceInputWrapper}>

                  <Text style={styles.inputPrefix}>
                    ₹
                  </Text>

                  <TextInput
                    value={tempMinPrice}
                    onChangeText={setTempMinPrice}
                    placeholder="Minimum"
                    placeholderTextColor={
                      colors.textMuted
                    }
                    keyboardType="numeric"
                    style={styles.priceInput}
                  />

                </View>


                <Text style={styles.toText}>
                  to
                </Text>


                <View style={styles.priceInputWrapper}>

                  <Text style={styles.inputPrefix}>
                    ₹
                  </Text>

                  <TextInput
                    value={tempMaxPrice}
                    onChangeText={setTempMaxPrice}
                    placeholder="Maximum"
                    placeholderTextColor={
                      colors.textMuted
                    }
                    keyboardType="numeric"
                    style={styles.priceInput}
                  />

                </View>

              </View>


              {/* QUICK PRICE */}

              <Text style={styles.quickLabel}>
                Quick price
              </Text>

              <View style={styles.chipContainer}>

                <FilterChip
                  label="Under ₹10K"
                  active={
                    tempMaxPrice === '10000'
                  }
                  onPress={() => {
                    setTempMinPrice('');
                    setTempMaxPrice('10000');
                  }}
                />

                <FilterChip
                  label="₹10K - ₹25K"
                  active={
                    tempMinPrice === '10000' &&
                    tempMaxPrice === '25000'
                  }
                  onPress={() => {
                    setTempMinPrice('10000');
                    setTempMaxPrice('25000');
                  }}
                />

                <FilterChip
                  label="₹25K - ₹50K"
                  active={
                    tempMinPrice === '25000' &&
                    tempMaxPrice === '50000'
                  }
                  onPress={() => {
                    setTempMinPrice('25000');
                    setTempMaxPrice('50000');
                  }}
                />

                <FilterChip
                  label="Above ₹50K"
                  active={
                    tempMinPrice === '50000' &&
                    tempMaxPrice === ''
                  }
                  onPress={() => {
                    setTempMinPrice('50000');
                    setTempMaxPrice('');
                  }}
                />

              </View>


              {/* BRAND */}

              <SectionTitle
                icon="pricetag-outline"
                title="Brand"
              />

              <TextInput
                value={tempBrand}
                onChangeText={setTempBrand}
                placeholder="e.g. Apple, Samsung, Dell"
                placeholderTextColor={
                  colors.textMuted
                }
                style={styles.fullInput}
                autoCapitalize="words"
              />


              {/* RAM */}

              <SectionTitle
                icon="hardware-chip-outline"
                title="RAM"
              />

              <View style={styles.chipContainer}>

                {RAM_OPTIONS.map((item) => (
                  <FilterChip
                    key={item.value || 'any'}
                    label={item.label}
                    active={
                      tempRam === item.value
                    }
                    onPress={() =>
                      setTempRam(item.value)
                    }
                  />
                ))}

              </View>


              {/* LOCATION */}

              <SectionTitle
                icon="location-outline"
                title="Location"
              />

              <TextInput
                value={tempPincode}
                onChangeText={setTempPincode}
                placeholder="Enter pincode"
                placeholderTextColor={
                  colors.textMuted
                }
                keyboardType="number-pad"
                maxLength={6}
                style={styles.fullInput}
              />

              <Text style={styles.locationInfo}>
                We'll show listings from the same
                postal area.
              </Text>


              {/* SEARCH */}

              <SectionTitle
                icon="search-outline"
                title="Search"
              />

              <TextInput
                value={searchText}
                onChangeText={setSearchText}
                placeholder="Phone, model, laptop..."
                placeholderTextColor={
                  colors.textMuted
                }
                style={styles.fullInput}
              />

              <View style={{ height: 120 }} />

            </ScrollView>

          </KeyboardAvoidingView>


          {/* APPLY BUTTON */}

          <View style={styles.applyContainer}>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={applyFilters}
              style={styles.applyButton}
            >

              <Ionicons
                name="checkmark-circle-outline"
                size={21}
                color={colors.white}
              />

              <Text style={styles.applyButtonText}>
                Show Listings
              </Text>

            </TouchableOpacity>

          </View>

        </SafeAreaView>

      </Modal>

    </SafeAreaView>
  );
}


// ============================================================
// STYLES
// ============================================================

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },

  smallHeaderText: {
    color: colors.textMuted,
    fontSize: 13,
    marginBottom: 2,
  },

  profileButton: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },

  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    paddingLeft: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    minHeight: 52,
    ...shadow.sm,
  },

  searchInput: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 14,
    paddingHorizontal: spacing.sm,
  },

  searchButton: {
    width: 42,
    height: 42,
    marginRight: 5,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },

  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.surface,
  },

  filterButtonText: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 14,
  },

  filterBadge: {
    minWidth: 20,
    height: 20,
    paddingHorizontal: 5,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  filterBadgeText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: '800',
  },

  clearButton: {
    marginLeft: 'auto',
    padding: 8,
  },

  clearButtonText: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: '700',
  },

  activeFiltersScroll: {
    maxHeight: 40,
    marginBottom: spacing.xs,
  },

  activeFilters: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
    gap: spacing.xs,
    alignItems: 'center',
  },

  activeChip: {
    backgroundColor: colors.primaryLight,
    borderRadius: radius.pill,
    paddingHorizontal: 11,
    paddingVertical: 6,
    alignSelf: 'flex-start',
  },

  activeChipText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },

  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },

  resultText: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },

  searchResultText: {
    color: colors.textMuted,
    fontSize: 13,
    marginLeft: 5,
  },

  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },

  emptyList: {
    flexGrow: 1,
  },

  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: 70,
  },

  emptyIcon: {
    width: 75,
    height: 75,
    borderRadius: 38,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 6,
  },

  emptyText: {
    textAlign: 'center',
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },

  resetButton: {
    marginTop: spacing.lg,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },

  resetButtonText: {
    color: colors.white,
    fontWeight: '700',
  },

  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },

  modalHeader: {
    height: 62,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },

  modalCloseButton: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
  },

  modalReset: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 14,
  },

  modalContent: {
    padding: spacing.lg,
  },

  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },

  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
  },

  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },

  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    paddingHorizontal: 13,
    paddingVertical: 9,
  },

  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },

  filterChipText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },

  filterChipTextActive: {
    color: colors.white,
    fontWeight: '700',
  },

  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  priceInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 12,
  },

  inputPrefix: {
    color: colors.textMuted,
    fontSize: 15,
    fontWeight: '700',
  },

  priceInput: {
    flex: 1,
    marginLeft: 5,
    color: colors.textPrimary,
    fontSize: 14,
  },

  toText: {
    color: colors.textMuted,
    fontSize: 13,
  },

  quickLabel: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },

  fullInput: {
    height: 50,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    color: colors.textPrimary,
    fontSize: 14,
  },

  locationInfo: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 6,
    lineHeight: 18,
  },

  applyContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },

  applyButton: {
    height: 52,
    borderRadius: radius.lg,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },

  applyButtonText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '800',
  },
});
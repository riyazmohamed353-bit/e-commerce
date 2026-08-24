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

// ============================================================
// CATEGORY-SPECIFIC FIELDS
// ============================================================

const CATEGORY_FIELDS = {
  Mobile: [
    {
      key: 'storage',
      label: 'Storage',
      placeholder: 'Example: 128GB / 256GB / 512GB',
    },
    {
      key: 'ram',
      label: 'RAM',
      placeholder: 'Example: 6GB / 8GB / 12GB',
    },
    {
      key: 'ageMonths',
      label: 'Age',
      placeholder: 'Example: 18',
      keyboardType: 'numeric',
      suffix: 'months',
    },
    {
      key: 'batteryHealth',
      label: 'Battery Health',
      placeholder: 'Example: 87',
      keyboardType: 'numeric',
      suffix: '%',
    },
  ],

  Laptop: [
    {
      key: 'storage',
      label: 'Storage',
      placeholder: 'Example: 512GB SSD / 1TB SSD',
    },
    {
      key: 'ram',
      label: 'RAM',
      placeholder: 'Example: 8GB / 16GB / 32GB',
    },
    {
      key: 'processor',
      label: 'Processor',
      placeholder: 'Example: Intel i7 / Ryzen 7',
    },
    {
      key: 'gpu',
      label: 'Graphics / GPU',
      placeholder: 'Example: RTX 4060 / Integrated',
    },
    {
      key: 'screenSize',
      label: 'Screen Size',
      placeholder: 'Example: 15.6 inch',
    },
    {
      key: 'ageMonths',
      label: 'Age',
      placeholder: 'Example: 24',
      keyboardType: 'numeric',
      suffix: 'months',
    },
    {
      key: 'batteryHealth',
      label: 'Battery Health',
      placeholder: 'Example: 90',
      keyboardType: 'numeric',
      suffix: '%',
    },
  ],

  Tablet: [
    {
      key: 'storage',
      label: 'Storage',
      placeholder: 'Example: 64GB / 128GB / 256GB',
    },
    {
      key: 'ram',
      label: 'RAM',
      placeholder: 'Example: 4GB / 6GB / 8GB',
    },
    {
      key: 'screenSize',
      label: 'Screen Size',
      placeholder: 'Example: 11 inch',
    },
    {
      key: 'ageMonths',
      label: 'Age',
      placeholder: 'Example: 12',
      keyboardType: 'numeric',
      suffix: 'months',
    },
    {
      key: 'batteryHealth',
      label: 'Battery Health',
      placeholder: 'Example: 90',
      keyboardType: 'numeric',
      suffix: '%',
    },
  ],

  Smartwatch: [
    {
      key: 'storage',
      label: 'Storage',
      placeholder: 'Example: 32GB',
    },
    {
      key: 'ram',
      label: 'RAM',
      placeholder: 'Example: 2GB',
    },
    {
      key: 'screenSize',
      label: 'Screen Size',
      placeholder: 'Example: 1.9 inch',
    },
    {
      key: 'compatibility',
      label: 'Compatibility',
      placeholder: 'Example: Android / iPhone / Both',
    },
    {
      key: 'ageMonths',
      label: 'Age',
      placeholder: 'Example: 12',
      keyboardType: 'numeric',
      suffix: 'months',
    },
    {
      key: 'batteryHealth',
      label: 'Battery Health',
      placeholder: 'Example: 85',
      keyboardType: 'numeric',
      suffix: '%',
    },
  ],

  Headphones: [
    {
      key: 'headphoneType',
      label: 'Headphone Type',
      placeholder: 'Example: Wireless / Wired / TWS',
    },
    {
      key: 'noiseCancellation',
      label: 'Noise Cancellation',
      placeholder: 'Example: Yes / No',
    },
    {
      key: 'batteryLife',
      label: 'Battery Life',
      placeholder: 'Example: 30 hours',
    },
    {
      key: 'compatibility',
      label: 'Compatibility',
      placeholder: 'Example: Android / iPhone / PC',
    },
    {
      key: 'ageMonths',
      label: 'Age',
      placeholder: 'Example: 12',
      keyboardType: 'numeric',
      suffix: 'months',
    },
  ],

  Camera: [
    {
      key: 'cameraType',
      label: 'Camera Type',
      placeholder: 'Example: DSLR / Mirrorless',
    },
    {
      key: 'megapixel',
      label: 'Megapixel',
      placeholder: 'Example: 24MP',
    },
    {
      key: 'lens',
      label: 'Lens',
      placeholder: 'Example: 18-55mm',
    },
    {
      key: 'shutterCount',
      label: 'Shutter Count',
      placeholder: 'Example: 12000',
      keyboardType: 'numeric',
    },
    {
      key: 'storage',
      label: 'Storage',
      placeholder: 'Example: 128GB SD Card',
    },
    {
      key: 'ageMonths',
      label: 'Age',
      placeholder: 'Example: 24',
      keyboardType: 'numeric',
      suffix: 'months',
    },
  ],

  Gaming: [
    {
      key: 'console',
      label: 'Gaming Device',
      placeholder: 'Example: PS5 / Xbox / Gaming PC',
    },
    {
      key: 'storage',
      label: 'Storage',
      placeholder: 'Example: 512GB / 1TB',
    },
    {
      key: 'ram',
      label: 'RAM',
      placeholder: 'Example: 16GB / 32GB',
    },
    {
      key: 'processor',
      label: 'Processor',
      placeholder: 'Example: Intel i5 / Ryzen 5',
    },
    {
      key: 'gpu',
      label: 'Graphics / GPU',
      placeholder: 'Example: RTX 4060',
    },
    {
      key: 'ageMonths',
      label: 'Age',
      placeholder: 'Example: 12',
      keyboardType: 'numeric',
      suffix: 'months',
    },
  ],

  Other: [
    {
      key: 'storage',
      label: 'Storage',
      placeholder: 'Example: 256GB',
    },
    {
      key: 'ram',
      label: 'RAM',
      placeholder: 'Example: 8GB',
    },
    {
      key: 'ageMonths',
      label: 'Age',
      placeholder: 'Example: 12',
      keyboardType: 'numeric',
      suffix: 'months',
    },
  ],
};

// ============================================================
// INITIAL SPECS
// ============================================================

const EMPTY_SPECS = {
  storage: '',
  ram: '',
  gpu: '',
  processor: '',
  ageMonths: '',
  batteryHealth: '',

  screenSize: '',
  cameraType: '',
  megapixel: '',
  lens: '',
  shutterCount: '',

  headphoneType: '',
  noiseCancellation: '',
  batteryLife: '',

  console: '',
  compatibility: '',
};

// ============================================================
// SCREEN
// ============================================================

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
  // BASIC FORM
  // ============================================================

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [sellerPrice, setSellerPrice] = useState('');

  const [specs, setSpecs] = useState(EMPTY_SPECS);

  const [conditionText, setConditionText] = useState('');

  const [photos, setPhotos] = useState([]);

  const [loadingListing, setLoadingListing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // ============================================================
  // UPDATE SPEC
  // ============================================================

  const updateSpec = (key, value) => {
    setSpecs((previous) => ({
      ...previous,
      [key]: value,
    }));
  };

  // ============================================================
  // LOAD LISTING FOR EDIT
  // ============================================================

  const loadListing = useCallback(async () => {
    if (!editingListingId) {
      return;
    }

    try {
      setLoadingListing(true);

      const response = await client.get(
        `/listings/${editingListingId}`
      );

      const listing =
        response.data?.listing ||
        response.data?.data ||
        response.data;

      if (!listing) {
        throw new Error('Listing not found.');
      }

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

      // ========================================================
      // LOAD SPECS
      // ========================================================

      const existingSpecs = listing.specs || {};

      setSpecs({
        ...EMPTY_SPECS,

        storage:
          existingSpecs.storage != null
            ? String(existingSpecs.storage)
            : '',

        ram:
          existingSpecs.ram != null
            ? String(existingSpecs.ram)
            : '',

        gpu:
          existingSpecs.gpu != null
            ? String(existingSpecs.gpu)
            : '',

        processor:
          existingSpecs.processor != null
            ? String(existingSpecs.processor)
            : '',

        ageMonths:
          existingSpecs.ageMonths != null
            ? String(existingSpecs.ageMonths)
            : '',

        batteryHealth:
          existingSpecs.batteryHealth != null
            ? String(existingSpecs.batteryHealth)
            : '',

        screenSize:
          existingSpecs.screenSize != null
            ? String(existingSpecs.screenSize)
            : '',

        cameraType:
          existingSpecs.cameraType != null
            ? String(existingSpecs.cameraType)
            : '',

        megapixel:
          existingSpecs.megapixel != null
            ? String(existingSpecs.megapixel)
            : '',

        lens:
          existingSpecs.lens != null
            ? String(existingSpecs.lens)
            : '',

        shutterCount:
          existingSpecs.shutterCount != null
            ? String(existingSpecs.shutterCount)
            : '',

        headphoneType:
          existingSpecs.headphoneType != null
            ? String(existingSpecs.headphoneType)
            : '',

        noiseCancellation:
          existingSpecs.noiseCancellation != null
            ? String(existingSpecs.noiseCancellation)
            : '',

        batteryLife:
          existingSpecs.batteryLife != null
            ? String(existingSpecs.batteryLife)
            : '',

        console:
          existingSpecs.console != null
            ? String(existingSpecs.console)
            : '',

        compatibility:
          existingSpecs.compatibility != null
            ? String(existingSpecs.compatibility)
            : '',
      });

      // ========================================================
      // DESCRIPTION
      // ========================================================

      setConditionText(
        listing.conditionText != null
          ? String(listing.conditionText)
          : ''
      );

      // ========================================================
      // PHOTOS
      // ========================================================

      const existingPhotos = Array.isArray(
        listing.photos
      )
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
    } catch (error) {
      console.log(
        'LOAD LISTING ERROR:',
        error.response?.data || error.message
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
  // EDIT LOAD
  // ============================================================

  useEffect(() => {
    if (isEditMode) {
      loadListing();
    }
  }, [isEditMode, loadListing]);

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

      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          'Permission Required',
          'Please allow photo access to select product images.'
        );

        return;
      }

      const result =
        await ImagePicker.launchImageLibraryAsync({
          mediaTypes:
            ImagePicker.MediaTypeOptions.Images,
          allowsMultipleSelection: true,
          selectionLimit: remaining,
          quality: 0.8,
        });

      if (result.canceled) {
        return;
      }

      const assets = Array.isArray(
        result.assets
      )
        ? result.assets
        : [];

      const selectedUris = assets
        .map((asset) => asset?.uri)
        .filter(Boolean);

      if (selectedUris.length === 0) {
        return;
      }

      setPhotos((previous) => {
        const existingUris = new Set(
          previous.map((photo) => photo.uri)
        );

        const newPhotos = selectedUris
          .filter(
            (uri) => !existingUris.has(uri)
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
  // CHANGE CATEGORY
  // ============================================================

  const handleCategoryChange = (newCategory) => {
    setCategory(newCategory);

    // Keep existing values that may be common,
    // but clear device-specific fields.
    setSpecs(EMPTY_SPECS);
  };

  // ============================================================
  // VALIDATION
  // ============================================================

  const validateForm = () => {
    if (!title.trim()) {
      Alert.alert(
        'Missing Title',
        'Please enter the product title.'
      );

      return false;
    }

    if (!category.trim()) {
      Alert.alert(
        'Missing Category',
        'Please select a category.'
      );

      return false;
    }

    if (!sellerPrice.trim()) {
      Alert.alert(
        'Missing Price',
        'Please enter your selling price.'
      );

      return false;
    }

    const price = Number(sellerPrice);

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

    // ==========================================================
    // AGE VALIDATION
    // ==========================================================

    if (specs.ageMonths.trim()) {
      const age = Number(
        specs.ageMonths
      );

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

    // ==========================================================
    // BATTERY VALIDATION
    // ==========================================================

    if (specs.batteryHealth.trim()) {
      const battery = Number(
        specs.batteryHealth
      );

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

    // ==========================================================
    // SHUTTER COUNT
    // ==========================================================

    if (specs.shutterCount.trim()) {
      const shutterCount = Number(
        specs.shutterCount
      );

      if (
        !Number.isFinite(
          shutterCount
        ) ||
        shutterCount < 0
      ) {
        Alert.alert(
          'Invalid Shutter Count',
          'Shutter count must be 0 or greater.'
        );

        return false;
      }
    }

    return true;
  };

  // ============================================================
  // BUILD SPECS
  // ============================================================

  const buildSpecs = () => {
    const result = {};

    Object.keys(specs).forEach((key) => {
      const value = specs[key];

      if (
        value !== null &&
        value !== undefined &&
        String(value).trim() !== ''
      ) {
        if (
          key === 'ageMonths' ||
          key === 'batteryHealth' ||
          key === 'shutterCount'
        ) {
          result[key] = Number(value);
        } else {
          result[key] = String(value).trim();
        }
      }
    });

    return result;
  };

  // ============================================================
  // SUBMIT
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

      const photoUris = photos
        .map((photo) => photo.uri)
        .filter(Boolean);

      const listingData = {
        title: title.trim(),

        category: category.trim(),

        brand: brand.trim(),

        model: model.trim(),

        sellerPrice: Number(
          sellerPrice
        ),

        conditionText:
          conditionText.trim(),

        specs: buildSpecs(),

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
      // UPDATE
      // ========================================================

      if (isEditMode) {
        const response =
          await client.patch(
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

      if (status === 401) {
        Alert.alert(
          'Login Required',
          'Your login session has expired. Please login again.'
        );

        return;
      }

      if (status === 400) {
        Alert.alert(
          'Invalid Listing',
          serverMessage ||
            'Please check the information you entered.'
        );

        return;
      }

      if (status === 403) {
        Alert.alert(
          'Permission Denied',
          serverMessage ||
            'You do not have permission to perform this action.'
        );

        return;
      }

      if (status === 404) {
        Alert.alert(
          'Not Found',
          serverMessage ||
            'The listing API endpoint was not found.'
        );

        return;
      }

      if (status >= 500) {
        Alert.alert(
          'Server Error',
          serverMessage ||
            'The server encountered an error. Please try again.'
        );

        return;
      }

      if (
        !error.response ||
        error.code === 'ERR_NETWORK'
      ) {
        Alert.alert(
          'Network Error',
          'Could not connect to the backend server. Check your internet connection and backend URL.'
        );

        return;
      }

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
  // LOADING
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
  // CURRENT CATEGORY FIELDS
  // ============================================================

  const currentFields =
    CATEGORY_FIELDS[
      category
    ] || [];

  // ============================================================
  // UI
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
              : 'Sell a Device'}
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
            SELLER
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
          placeholder={
            category === 'Laptop'
              ? 'Example: ASUS ROG Strix G16'
              : category === 'Tablet'
              ? 'Example: iPad Air 5th Gen'
              : category === 'Smartwatch'
              ? 'Example: Apple Watch Series 9'
              : category === 'Headphones'
              ? 'Example: Sony WH-1000XM5'
              : category === 'Camera'
              ? 'Example: Canon EOS R10'
              : category === 'Gaming'
              ? 'Example: PS5 Digital Edition'
              : category === 'Mobile'
              ? 'Example: iPhone 14 Pro 256GB'
              : 'Example: Used electronic device'
          }
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
                category === item;

              return (
                <TouchableOpacity
                  key={item}
                  style={[
                    styles.categoryButton,
                    selected &&
                      styles.categoryButtonSelected,
                  ]}
                  onPress={() =>
                    handleCategoryChange(
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
          placeholder={
            category === 'Laptop'
              ? 'Example: ASUS / Dell / HP / Lenovo'
              : category === 'Mobile'
              ? 'Example: Apple / Samsung / OnePlus'
              : category === 'Camera'
              ? 'Example: Canon / Sony / Nikon'
              : category === 'Headphones'
              ? 'Example: Sony / Bose / JBL'
              : 'Example: Apple / Samsung'
          }
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
          placeholder={
            category === 'Laptop'
              ? 'Example: ROG Strix G16'
              : category === 'Tablet'
              ? 'Example: iPad Air 5'
              : category === 'Camera'
              ? 'Example: EOS R10'
              : category === 'Headphones'
              ? 'Example: WH-1000XM5'
              : category === 'Gaming'
              ? 'Example: PS5 Slim'
              : category === 'Mobile'
              ? 'Example: iPhone 14 Pro'
              : 'Example: Device model'
          }
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
          placeholder={
            category === 'Laptop'
              ? 'Example: 65000'
              : category === 'Mobile'
              ? 'Example: 45000'
              : category === 'Camera'
              ? 'Example: 55000'
              : 'Example: 25000'
          }
          value={sellerPrice}
          onChangeText={
            setSellerPrice
          }
          keyboardType="numeric"
          prefix="₹"
        />

        {/* ======================================================
            DYNAMIC SPECIFICATIONS
        ====================================================== */}

        {category && (
          <>
            <Text
              style={
                styles.sectionTitle
              }
            >
              {category} Specifications
            </Text>

            <Text
              style={
                styles.sectionSubtitle
              }
            >
              Enter details specific to your{' '}
              {category.toLowerCase()}.
            </Text>

            {currentFields.map(
              (field) => (
                <InputField
                  key={field.key}
                  label={field.label}
                  placeholder={
                    field.placeholder
                  }
                  value={
                    specs[
                      field.key
                    ] || ''
                  }
                  onChangeText={(
                    value
                  ) =>
                    updateSpec(
                      field.key,
                      value
                    )
                  }
                  keyboardType={
                    field.keyboardType
                  }
                  suffix={
                    field.suffix
                  }
                />
              )
            )}
          </>
        )}

        {/* ======================================================
            SELECT CATEGORY MESSAGE
        ====================================================== */}

        {!category && (
          <View
            style={
              styles.selectCategoryBox
            }
          >
            <Ionicons
              name="options-outline"
              size={24}
              color="#2563eb"
            />

            <Text
              style={
                styles.selectCategoryText
              }
            >
              Select a category above to see
              device-specific specifications.
            </Text>
          </View>
        )}

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
          placeholder={
            category === 'Laptop'
              ? 'Describe laptop condition, keyboard, display, charger, warranty, etc.'
              : category === 'Mobile'
              ? 'Describe phone condition, display, battery, accessories, warranty, etc.'
              : category === 'Camera'
              ? 'Describe camera condition, lens, accessories, warranty, etc.'
              : 'Describe condition, accessories, warranty, etc.'
          }
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
            INFO
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
// REUSABLE INPUT
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

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },

  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },

  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },

  // ==========================================================
  // LOADING
  // ==========================================================

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },

  loadingText: {
    marginTop: 12,
    color: '#64748b',
    fontSize: 15,
  },

  // ==========================================================
  // HEADER
  // ==========================================================

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

  // ==========================================================
  // SELLER
  // ==========================================================

  sellerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 14,
    padding: 13,
    marginBottom: 22,
  },

  sellerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#dbeafe',
    alignItems: 'center',
    justifyContent: 'center',
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

  // ==========================================================
  // SECTIONS
  // ==========================================================

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

  // ==========================================================
  // PHOTOS
  // ==========================================================

  photoScroll: {
    marginBottom: 15,
  },

  photoWrapper: {
    width: 110,
    height: 110,
    borderRadius: 12,
    marginRight: 10,
    overflow: 'hidden',
    backgroundColor: '#e2e8f0',
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
    backgroundColor: 'rgba(220,38,38,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  newPhotoBadge: {
    position: 'absolute',
    left: 5,
    bottom: 5,
    backgroundColor: '#16a34a',
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
    borderColor: '#93c5fd',
    borderStyle: 'dashed',
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
  },

  addPhotoText: {
    color: '#2563eb',
    fontWeight: '700',
    fontSize: 12,
    marginTop: 6,
  },

  // ==========================================================
  // INPUTS
  // ==========================================================

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
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
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

  // ==========================================================
  // CATEGORY
  // ==========================================================

  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 5,
  },

  categoryButton: {
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#fff',
    marginRight: 8,
    marginBottom: 8,
  },

  categoryButtonSelected: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },

  categoryText: {
    color: '#475569',
    fontSize: 13,
    fontWeight: '700',
  },

  categoryTextSelected: {
    color: '#fff',
  },

  // ==========================================================
  // SELECT CATEGORY
  // ==========================================================

  selectCategoryBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 11,
    padding: 13,
    marginTop: 18,
  },

  selectCategoryText: {
    flex: 1,
    color: '#1e40af',
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '600',
    marginLeft: 9,
  },

  // ==========================================================
  // DESCRIPTION
  // ==========================================================

  textArea: {
    minHeight: 130,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 11,
    padding: 13,
    color: '#111827',
    fontSize: 15,
  },

  // ==========================================================
  // INFO
  // ==========================================================

  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
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

  // ==========================================================
  // SUBMIT
  // ==========================================================

  submitButton: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563eb',
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
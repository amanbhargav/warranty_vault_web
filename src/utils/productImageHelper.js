/**
 * Product Image Helper - Maps product types to local default images
 * No external API calls - uses only local assets
 */

import smartWatchImg from '../assets/images/default_smart_watch_image.jpeg';
import fanImg from '../assets/images/default_fan_image.jpeg';
import earphoneImg from '../assets/images/default_earphone_image.jpeg';
import acImg from '../assets/images/default_ac_image.jpeg';
import laptopTabletImg from '../assets/images/default_laptop_tablet_image.jpeg';
import mobilePhoneImg from '../assets/images/default_mobile_phone_image.jpeg';
import refrigeratorImg from '../assets/images/default_refrigerator_image.jpeg';
import productImg from '../assets/images/default_product_image.jpeg';

// Image mapping configuration
const IMAGE_MAPPING = {
  smartwatch: smartWatchImg,
  fan: fanImg,
  headphones: earphoneImg,
  earphones: earphoneImg,
  earphone: earphoneImg,
  ac: acImg,
  'air conditioner': acImg,
  'air-conditioner': acImg,
  laptop: laptopTabletImg,
  tablet: laptopTabletImg,
  mobile: mobilePhoneImg,
  phone: mobilePhoneImg,
  smartphone: mobilePhoneImg,
  refrigerator: refrigeratorImg,
  fridge: refrigeratorImg,
  generic: productImg,
};

// Category detection keywords
const CATEGORY_KEYWORDS = {
  smartwatch: [
    'watch', 'smartwatch', 'smart watch', 'fitness watch', 'fitness tracker',
    'digital watch', 'sports watch', 'apple watch', 'galaxy watch',
    'garmin', 'fitbit', 'polar', 'suunto', 'fossil', 'tissot',
    'casio', 'seiko', 'omega', 'tag heuer', 'g-shock'
  ],
  fan: [
    'fan', 'ceiling fan', 'table fan', 'standing fan', 'pedestal fan',
    'exhaust fan', 'tower fan', 'box fan'
  ],
  headphones: [
    'headphones', 'earphones', 'earphone', 'earbuds', 'headset',
    'in-ear', 'over-ear', 'on-ear', 'bluetooth headphones',
    'wireless headphones', 'noise cancelling'
  ],
  ac: [
    'ac', 'air conditioner', 'air-conditioner', 'aircon', 'split ac',
    'window ac', 'portable ac', 'central air', 'cooling unit'
  ],
  laptop: [
    'laptop', 'notebook', 'ultrabook', 'macbook', 'thinkpad',
    'chromebook', 'gaming laptop', 'business laptop'
  ],
  tablet: [
    'tablet', 'ipad', 'android tablet', 'surface', 'kindle',
    'galaxy tab', 'drawing tablet', 'graphics tablet'
  ],
  mobile: [
    'mobile', 'phone', 'smartphone', 'iphone', 'android',
    'galaxy phone', 'pixel', 'oneplus', 'xiaomi', 'oppo', 'vivo'
  ],
  refrigerator: [
    'refrigerator', 'fridge', 'freezer', 'icebox', 'cooler',
    'mini fridge', 'compact refrigerator', 'side-by-side'
  ]
};

/**
 * Main function to get default product image based on product name
 * @param {string} productName - Product name from invoice
 * @param {string} brand - Optional brand name
 * @returns {string} - Path to default image
 */
export function getDefaultProductImage(productName, brand = '', currentUrl = '') {
  // 1. Try to match by current URL first (in case it's a local key)
  if (currentUrl) {
    if (currentUrl.includes('smart_watch')) return smartWatchImg;
    if (currentUrl.includes('fan_image')) return fanImg;
    if (currentUrl.includes('earphone')) return earphoneImg;
    if (currentUrl.includes('ac_image')) return acImg;
    if (currentUrl.includes('laptop_tablet')) return laptopTabletImg;
    if (currentUrl.includes('mobile_phone')) return mobilePhoneImg;
    if (currentUrl.includes('refrigerator')) return refrigeratorImg;
    if (currentUrl.includes('product_image')) return productImg;
  }

  if (!productName || typeof productName !== 'string') {
    return IMAGE_MAPPING.generic;
  }

  // 2. Convert to lowercase for case-insensitive matching
  const name = productName.toLowerCase();
  const brandName = (brand || '').toLowerCase();

  // 3. Check each category for keyword matches
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    const nameMatch = keywords.some(keyword => name.includes(keyword));
    const brandMatch = keywords.some(keyword => brandName.includes(keyword));

    if (nameMatch || brandMatch) {
      return IMAGE_MAPPING[category];
    }
  }

  // 4. No category matched - return generic default
  return IMAGE_MAPPING.generic;
}

/**
 * Get category name based on product name
 * @param {string} productName - Product name 
 * @returns {string} - Detected category
 */
export function getProductCategory(productName, brand = '') {
  if (!productName || typeof productName !== 'string') {
    return 'generic';
  }

  const name = productName.toLowerCase();
  const brandName = (brand || '').toLowerCase();

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    const nameMatch = keywords.some(keyword => name.includes(keyword));
    const brandMatch = keywords.some(keyword => brandName.includes(keyword));

    if (nameMatch || brandMatch) {
      return category;
    }
  }

  return 'generic';
}

/**
 * Get all available default images
 * @returns {object} - All image mappings
 */
export function getAllDefaultImages() {
  return { ...IMAGE_MAPPING };
}

export default {
  getDefaultProductImage,
  getProductCategory,
  getAllDefaultImages
};

import type { Destination } from '../destinationTypes';

export const coreDestinations: Destination[] = [
  {
    slug: 'istanbul', city: 'Стамбул', country: 'Турция', badge: 'Город у двух морей', description: 'Босфор, дворцы, яркие базары и ужины на террасах с видом на старый город.',
    visa: 'Без визы', season: 'апрель — июнь', duration: '7 дней · 2 человека', price: 'от 620 000 ₸', rating: '4,9', reviews: '2 840 отзывов',
    region: 'Евразия', tags: ['Город', 'Культура', 'Гастрономия'], themeIds: ['city', 'culture', 'food'], priceValue: 620000, ratingValue: 4.9, visualScore: 87, visaCategory: 'visa-free', coordinates: [41.0082, 28.9784],
    image: 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?auto=format&fit=crop&w=2200&q=90',
  },
  {
    slug: 'bali', city: 'Бали', country: 'Индонезия', badge: 'Остров впечатлений', description: 'Тропические пляжи, рисовые террасы, серфинг и спокойные виллы среди зелени.',
    visa: 'Виза по прибытии', season: 'май — октябрь', duration: '10 дней · 2 человека', price: 'от 1 180 000 ₸', rating: '4,9', reviews: '3 120 отзывов',
    region: 'Юго-Восточная Азия', tags: ['Пляж', 'Природа', 'Приключения'], themeIds: ['beach', 'nature', 'adventure'], priceValue: 1180000, ratingValue: 4.9, visualScore: 94, visaCategory: 'on-arrival', coordinates: [-8.4095, 115.1889],
    image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=2200&q=90',
  },
  {
    slug: 'tokyo', city: 'Токио', country: 'Япония', badge: 'Будущее и традиции', description: 'Неоновые кварталы, тихие сады, выдающаяся кухня и безупречный городской ритм.',
    visa: 'Нужна виза', season: 'март — май', duration: '8 дней · 2 человека', price: 'от 1 420 000 ₸', rating: '4,9', reviews: '1 960 отзывов',
    region: 'Восточная Азия', tags: ['Город', 'Культура', 'Гастрономия'], themeIds: ['city', 'culture', 'food'], priceValue: 1420000, ratingValue: 4.9, visualScore: 90, visaCategory: 'advance', coordinates: [35.6762, 139.6503],
    image: 'https://images.unsplash.com/photo-1758721378135-be02842f17c7?auto=format&fit=crop&w=2200&q=90',
  },
  {
    slug: 'singapore', city: 'Сингапур', country: 'Сингапур', badge: 'Тропический мегаполис', description: 'Футуристичная архитектура, сады, безупречные улицы и кухни всей Азии.',
    visa: 'Нужна виза', season: 'февраль — апрель', duration: '6 дней · 2 человека', price: 'от 1 260 000 ₸', rating: '4,8', reviews: '1 540 отзывов',
    region: 'Юго-Восточная Азия', tags: ['Город', 'Природа', 'Гастрономия'], themeIds: ['city', 'nature', 'food'], priceValue: 1260000, ratingValue: 4.8, visualScore: 88, visaCategory: 'advance', coordinates: [1.3521, 103.8198],
    image: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?auto=format&fit=crop&w=2200&q=90',
  },
  {
    slug: 'tbilisi', city: 'Тбилиси', country: 'Грузия', badge: 'Тёплый городской отдых', description: 'Балконы старого города, серные бани, винные бары и горы совсем рядом.',
    visa: 'Без визы', season: 'май — октябрь', duration: '5 дней · 2 человека', price: 'от 410 000 ₸', rating: '4,9', reviews: '2 360 отзывов',
    region: 'Кавказ', tags: ['Город', 'Культура', 'Гастрономия', 'Природа'], themeIds: ['city', 'culture', 'food', 'nature'], priceValue: 410000, ratingValue: 4.9, visualScore: 80, visaCategory: 'visa-free', coordinates: [41.7151, 44.8271],
    image: 'https://images.unsplash.com/photo-1565008576549-57569a49371d?auto=format&fit=crop&w=2200&q=90',
  },
  {
    slug: 'hong-kong', city: 'Гонконг', country: 'Китай', badge: 'Город контрастов', description: 'Гавань, небоскрёбы, зелёные тропы и легендарная уличная кухня.',
    visa: 'Без визы до 14 дней', season: 'октябрь — декабрь', duration: '7 дней · 2 человека', price: 'от 1 090 000 ₸', rating: '4,8', reviews: '1 780 отзывов',
    region: 'Восточная Азия', tags: ['Город', 'Природа', 'Приключения', 'Гастрономия'], themeIds: ['city', 'nature', 'adventure', 'food'], priceValue: 1090000, ratingValue: 4.8, visualScore: 86, visaCategory: 'visa-free', coordinates: [22.3193, 114.1694],
    image: 'https://images.unsplash.com/photo-1536599018102-9f803c140fc1?auto=format&fit=crop&w=2200&q=90',
  },
  {
    slug: 'rome', city: 'Рим', country: 'Италия', badge: 'Вечная классика', description: 'Античные улицы, искусство, камерные площади и неспешные итальянские вечера.',
    visa: 'Шенгенская виза', season: 'апрель — июнь', duration: '8 дней · 2 человека', price: 'от 1 350 000 ₸', rating: '4,9', reviews: '2 210 отзывов',
    region: 'Европа', tags: ['Город', 'Культура', 'Гастрономия'], themeIds: ['city', 'culture', 'food'], priceValue: 1350000, ratingValue: 4.9, visualScore: 85, visaCategory: 'advance', coordinates: [41.9028, 12.4964],
    image: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=2200&q=90',
  },
  {
    slug: 'nha-trang', city: 'Нячанг', country: 'Вьетнам', badge: 'Море и город', description: 'Яркая береговая линия, острова, свежие морепродукты и живая городская набережная.',
    visa: 'Без визы до 30 дней', season: 'февраль — август', duration: '10 дней · 2 человека', price: 'от 940 000 ₸', rating: '4,8', reviews: '1 690 отзывов',
    region: 'Юго-Восточная Азия', tags: ['Пляж', 'Город', 'Природа'], themeIds: ['beach', 'city', 'nature'], priceValue: 940000, ratingValue: 4.8, visualScore: 82, visaCategory: 'visa-free', coordinates: [12.2388, 109.1967],
    image: 'https://images.unsplash.com/photo-1570366290364-5e76a15ae408?auto=format&fit=crop&w=2200&q=90',
  },
];

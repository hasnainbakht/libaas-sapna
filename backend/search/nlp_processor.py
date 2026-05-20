import re
from typing import Dict, Optional

# Urdu/English keyword mappings
URDU_TO_ENGLISH = {
    # Colors — masculine singular
    'سفید': 'white',
    'سیاہ': 'black', 'کالا': 'black',
    'لال': 'red', 'سرخ': 'red',
    'نیلا': 'blue', 'آسمانی': 'blue',
    'سبز': 'green', 'ہرا': 'green',
    'بھورا': 'brown',
    'پیلا': 'yellow',
    'گلابی': 'pink',
    'سلیٹی': 'grey',
    'جامنی': 'purple',
    'نارنجی': 'orange',
    # Colors — feminine singular
    'کالی': 'black',
    'نیلی': 'blue',
    'بھوری': 'brown',
    'پیلی': 'yellow',
    'ہری': 'green',
    # Colors — plural / oblique
    'کالے': 'black',
    'نیلے': 'blue',
    'بھورے': 'brown',
    'پیلے': 'yellow',
    'ہرے': 'green',
    # Clothing & misc
    'کرتا': 'kurta',
    'شلوار': 'shalwar',
    'قمیض': 'qameez',
    'دوپٹہ': 'dupatta',
    'مرد': 'male',
    'عورت': 'female',
}

# Roman Urdu mappings
ROMAN_URDU_TO_ENGLISH = {
    # Colors — base
    'safed': 'white',
    'kala': 'black',
    'laal': 'red', 'surkh': 'red',
    'neela': 'blue', 'asmani': 'blue',
    'sabz': 'green', 'hara': 'green',
    'bhura': 'brown',
    'peela': 'yellow',
    'gulabi': 'pink',
    'sleti': 'grey',
    'jamni': 'purple',
    'narangi': 'orange',
    # Colors — feminine
    'kali': 'black',
    'neeli': 'blue',
    'bhuri': 'brown',
    'peeli': 'yellow',
    'hari': 'green',
    # Colors — plural / oblique
    'kalay': 'black', 'kaley': 'black',
    'neelay': 'blue', 'neley': 'blue', 'neeley': 'blue',
    'bhuray': 'brown', 'bhurey': 'brown',
    'peelay': 'yellow', 'peeley': 'yellow',
    'haray': 'green', 'harey': 'green',
    # Clothing & misc
    'kurta': 'kurta',
    'shalwar': 'shalwar',
    'qameez': 'qameez',
    'dupatta': 'dupatta',
    'mard': 'male',
    'aurat': 'female',
    'larki': 'female',
    'larka': 'male',
    'stitched': 'stitched',
    'unstitched': 'unstitched',
    'silk': 'silk',
    'cotton': 'cotton',
    'lawn': 'lawn',
}

COLOR_KEYWORDS = {
    'white', 'black', 'red', 'blue', 'green', 'yellow', 'pink', 'purple',
    'orange', 'brown', 'gray', 'grey', 'maroon', 'navy', 'beige'
}

FABRIC_KEYWORDS = {
    'cotton', 'silk', 'lawn', 'chiffon', 'linen', 'velvet', 'khaddar',
    'cambric', 'karandi', 'viscose', 'jamawar'
}

ITEM_KEYWORDS = {
    'kurta': 'kurta',
    'qameez': 'qameez',
    'kameez': 'qameez',
    'shalwar': 'shalwar',
    'dupatta': 'dupatta',
    'dress': 'dress',
    'shirt': 'shirt',
    'trouser': 'trouser',
    'suit': 'suit',
}

GENDER_KEYWORDS = {
    'male': 'male',
    'female': 'female',
    'men': 'male',
    'women': 'female',
    'ladies': 'female',
    'gents': 'male',
    'boys': 'male',
    'girls': 'female',
}

STITCHED_KEYWORDS = {
    'stitched': True,
    'unstitched': False,
    'readymade': True,
    'ready': True,
    'unstitch': False,
    'unstiched': False,
    'unspich': False,
    'anspich': False,
    'anstitch': False,
    # Urdu script variations
    'سٹچ': True,
    'سٹچڈ': True,
    'سلا ہوا': True,
    'ریڈی میڈ': True,
    'ان سٹچ': False,
    'ان اسپیچ': False,
    'ان سپیچ': False,
    'غیر سلا': False,
    'بغیر سلائی': False,
}


class NLPQueryProcessor:
    def normalize_text(self, text: str) -> str:
        """Normalize and clean text"""
        text = text.lower().strip()
        text = re.sub(r'\s+', ' ', text)
        return text

    def translate_urdu_terms(self, text: str) -> str:
        """Translate Urdu and Roman Urdu terms to English"""
        words = text.split()
        translated_words = []

        for word in words:
            if word in URDU_TO_ENGLISH:
                translated_words.append(URDU_TO_ENGLISH[word])
            elif word in ROMAN_URDU_TO_ENGLISH:
                translated_words.append(ROMAN_URDU_TO_ENGLISH[word])
            else:
                translated_words.append(word)

        return ' '.join(translated_words)

    def extract_color(self, text: str) -> Optional[str]:
        """Extract color from query"""
        words = text.split()
        for word in words:
            if word in COLOR_KEYWORDS:
                return word
        return None

    def extract_fabric(self, text: str) -> Optional[str]:
        """Extract fabric from query"""
        words = text.split()
        for word in words:
            if word in FABRIC_KEYWORDS:
                return word
        return None

    def extract_item_type(self, text: str) -> Optional[str]:
        """Extract item type from query"""
        for keyword, item_type in ITEM_KEYWORDS.items():
            if keyword in text:
                return item_type
        return None

    def extract_gender(self, text: str) -> Optional[str]:
        """Extract gender from query"""
        for keyword, gender in GENDER_KEYWORDS.items():
            if keyword in text:
                return gender
        return None

    def extract_stitched(self, text: str) -> Optional[bool]:
        """Extract stitched/unstitched status"""
        for keyword, is_stitched in STITCHED_KEYWORDS.items():
            if keyword in text:
                return is_stitched
        return None

    def extract_price(self, text: str) -> Optional[float]:
        """Extract maximum price from query"""
        price_patterns = [
            r'under\s+(\d+)',
            r'less\s+than\s+(\d+)',
            r'below\s+(\d+)',
            r'maximum\s+(\d+)',
            r'max\s+(\d+)',
        ]

        for pattern in price_patterns:
            match = re.search(pattern, text)
            if match:
                return float(match.group(1))

        price_match = re.search(r'(\d+)\s*(rs|rupees|pkr)?', text)
        if price_match:
            return float(price_match.group(1))

        return None

    def detect_sort_preference(self, text: str) -> str:
        """Detect sorting preference"""
        if 'cheap' in text or 'low price' in text or 'affordable' in text:
            return 'price'
        elif 'expensive' in text or 'high price' in text or 'premium' in text:
            return '-price'
        elif 'new' in text or 'latest' in text or 'recent' in text:
            return '-created_at'
        elif 'popular' in text or 'trending' in text or 'bestselling' in text:
            return 'trending'
        return 'created_at'

    def process_query(self, query: str) -> Dict:
        """Main method to process search query and extract entities"""
        normalized_query = self.normalize_text(query)
        translated_query = self.translate_urdu_terms(normalized_query)

        entities = {
            'original_query': query,
            'normalized_query': translated_query,
            'item_type': self.extract_item_type(translated_query),
            'color': self.extract_color(translated_query),
            'fabric': self.extract_fabric(translated_query),
            'gender': self.extract_gender(translated_query),
            'stitched': self.extract_stitched(translated_query),
            'price_max': self.extract_price(translated_query),
            'sort_by': self.detect_sort_preference(translated_query),
        }

        return entities


# Create singleton instance
nlp_processor = NLPQueryProcessor()



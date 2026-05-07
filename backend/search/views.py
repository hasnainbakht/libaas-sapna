from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.db.models import Q
from .nlp_processor import nlp_processor
from products.models import Product
from products.serializers import ProductListSerializer
import requests
import json


OPENROUTER_API_KEY = config("OPENROUTER_API_KEY", default="")
OPENROUTER_MODEL = "nvidia/nemotron-3-super-120b-a12b:free"
OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"


def call_openrouter_llm(prompt: str) -> str:
    """Call the OpenRouter API with Nemotron model and return the response text."""
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "LIBAAS SAPNA",
    }
    payload = {
        "model": OPENROUTER_MODEL,
        "messages": [
            {
                "role": "system",
                "content": (
                    "You are a highly accurate multilingual assistant specializing in Pakistani clothing and fashion. "
                    "You understand three input types: "
                    "1. Native Urdu script (e.g. لال کرتا، نیلا لان). "
                    "2. Roman Urdu (Urdu written in Latin/English script, e.g. laal kurta, neela lawn). "
                    "3. English (e.g. red kurta, blue lawn). "
                    "Your job is to translate any of the above into English and extract structured product search tags for a Pakistani clothing store."
                ),
            },
            {"role": "user", "content": prompt},
        ],
        "temperature": 0.2,
        "max_tokens": 400,
    }
    try:
        response = requests.post(OPENROUTER_URL, headers=headers, json=payload, timeout=15)
        response.raise_for_status()
        data = response.json()
        return data["choices"][0]["message"]["content"].strip()
    except Exception as e:
        return ""


def parse_llm_tags_response(llm_text: str) -> dict:
    """
    Parse the structured JSON response from the LLM.
    Handles common LLM quirks like comma-separated numbers (5,000 → 5000).
    """
    try:
        import re

        # Look for JSON between ```json ... ``` or just raw JSON
        json_match = re.search(r'\{.*\}', llm_text, re.DOTALL)
        if json_match:
            raw_json = json_match.group()

            # Fix comma-separated numbers: "5,000" → "5000", "10,500" → "10500"
            # Match digits followed by comma and 3 more digits (common thousand separator)
            raw_json = re.sub(r'(\d),(\d{3})', r'\1\2', raw_json)

            parsed = json.loads(raw_json)

            # Post-parse: ensure price fields are proper numbers
            if 'tags' in parsed:
                for price_key in ['price_min', 'price_max']:
                    val = parsed['tags'].get(price_key)
                    if val is not None and val != 'null':
                        try:
                            # Handle string prices like "5000" or "5,000"
                            if isinstance(val, str):
                                val = val.replace(',', '')
                            parsed['tags'][price_key] = float(val)
                        except (ValueError, TypeError):
                            parsed['tags'][price_key] = None
                    elif val == 'null':
                        parsed['tags'][price_key] = None

            return parsed
    except Exception:
        pass
    return {}


def extract_tags_locally(query: str) -> dict:
    """
    Locally extract ALL product tags from query using regex patterns.
    Handles Urdu script, Roman Urdu, and English.
    Runs BEFORE/alongside LLM for reliability.
    """
    import re
    result = {}
    q = query.lower().strip()
    q_original = query.strip()

    # Normalize Urdu numerals to ASCII
    urdu_digits = {'۰':'0','۱':'1','۲':'2','۳':'3','۴':'4','۵':'5','۶':'6','۷':'7','۸':'8','۹':'9'}
    for ud, ad in urdu_digits.items():
        q = q.replace(ud, ad)
    # Remove commas from numbers (5,000 → 5000)
    q = re.sub(r'(\d),(\d{3})', r'\1\2', q)

    # --- GENDER ---
    male_words = ['مردانہ', 'مرد', 'مردوں', 'men', 'male', 'gents', 'mardana', 'mard', 'mardon', 'boys', 'boy']
    female_words = ['زنانہ', 'عورت', 'عورتوں', 'خواتین', 'لڑکی', 'women', 'female', 'ladies', 'lady', 'zanana', 'aurat', 'khawateen', 'larki', 'girls', 'girl']
    for w in male_words:
        if w in q or w in q_original:
            result['gender'] = 'male'
            break
    if 'gender' not in result:
        for w in female_words:
            if w in q or w in q_original:
                result['gender'] = 'female'
                break

    # --- COLOR ---
    color_map = {
        # Urdu script
        'سفید': 'white', 'وائٹ': 'white', 'کالا': 'black', 'بلیک': 'black',
        'لال': 'red', 'ریڈ': 'red', 'نیلا': 'blue', 'بلو': 'blue',
        'بھورا': 'brown', 'براؤن': 'brown', 'پیلا': 'yellow',
        'گلابی': 'pink', 'پنک': 'pink', 'سبز': 'green', 'گرین': 'green',
        'سلیٹی': 'grey', 'گرے': 'grey', 'جامنی': 'purple', 'مرون': 'maroon',
        'نیوی': 'navy', 'بیج': 'beige', 'زیتونی': 'olive',
        # Roman Urdu
        'safed': 'white', 'white': 'white', 'kala': 'black', 'black': 'black',
        'laal': 'red', 'red': 'red', 'neela': 'blue', 'blue': 'blue',
        'bhura': 'brown', 'brown': 'brown', 'peela': 'yellow', 'yellow': 'yellow',
        'gulabi': 'pink', 'pink': 'pink', 'sabz': 'green', 'hara': 'green', 'green': 'green',
        'sleti': 'grey', 'grey': 'grey', 'gray': 'grey',
        'jamni': 'purple', 'purple': 'purple', 'maroon': 'maroon',
        'navy': 'navy', 'beige': 'beige', 'olive': 'olive',
        'orange': 'orange', 'narangi': 'orange', 'mustard': 'mustard',
        'teal': 'teal', 'coral': 'coral',
    }
    for word, color_val in color_map.items():
        if word in q or word in q_original:
            result['color'] = color_val
            break

    # --- ITEM TYPE ---
    item_map = {
        'شلوار': 'shalwar', 'قمیض': 'qameez', 'کرتا': 'kurta', 'سوٹ': 'suit',
        'دوپٹہ': 'dupatta', 'حجاب': 'hijab', 'عبایا': 'abaya',
        'shalwar': 'shalwar', 'qameez': 'qameez', 'kameez': 'kameez', 'kurta': 'kurta',
        'suit': 'suit', 'dupatta': 'dupatta', 'hijab': 'hijab', 'abaya': 'abaya',
        'shirt': 'shirt', 'dress': 'dress', 'trouser': 'trouser',
    }
    for word, item_val in item_map.items():
        if word in q or word in q_original:
            result['item_type'] = item_val
            break

    # --- CATEGORY ---
    cat_map = {
        'غیر سلا': 'unstitched', 'ان سٹچ': 'unstitched', 'unstitched': 'unstitched',
        'سلا ہوا': 'stitched', 'سٹچ': 'stitched', 'stitched': 'stitched',
    }
    for word, cat_val in cat_map.items():
        if word in q or word in q_original:
            result['category'] = cat_val
            break

    # --- FABRIC ---
    fabric_map = {
        'لان': 'lawn', 'lawn': 'lawn', 'کاٹن': 'cotton', 'cotton': 'cotton',
        'ریشم': 'silk', 'silk': 'silk', 'شفون': 'chiffon', 'chiffon': 'chiffon',
        'کھدر': 'khaddar', 'khaddar': 'khaddar', 'آرگنزا': 'organza', 'organza': 'organza',
        'واش اینڈ ویئر': 'wash & wear', 'wash and wear': 'wash & wear',
        'jacquard': 'jacquard', 'جیکارڈ': 'jacquard',
        'dobby': 'dobby', 'ڈوبی': 'dobby',
        'linen': 'linen', 'لینن': 'linen',
    }
    for word, fab_val in fabric_map.items():
        if word in q or word in q_original:
            result['fabric'] = fab_val
            break

    # --- PRICE (same as before) ---
    # UNDER patterns
    m = re.search(r'(?:under|below|less than|upto|up to)\s*(?:rs\.?\s*)?(\d+)', q)
    if m:
        result['price_max'] = float(m.group(1))
        return result
    m = re.search(r'(\d+)\s*(?:se\s*(?:kam|neeche|nichay|neechay|kum|sasta|sasti|sastay))', q)
    if m:
        result['price_max'] = float(m.group(1))
        return result
    m = re.search(r'(\d+)\s*(?:tak)', q)
    if m:
        result['price_max'] = float(m.group(1))
        return result
    m = re.search(r'(\d+)\s*سے\s*(?:کم|نیچے|کمتر|سستا|سستی|سستے)', q)
    if m:
        result['price_max'] = float(m.group(1))
        return result
    m = re.search(r'(\d+)\s*(?:تک)', q)
    if m:
        result['price_max'] = float(m.group(1))
        return result

    # ABOVE patterns
    m = re.search(r'(?:above|over|more than|greater than)\s*(?:rs\.?\s*)?(\d+)', q)
    if m:
        result['price_min'] = float(m.group(1))
        return result
    m = re.search(r'(\d+)\s*(?:se\s*(?:zyada|ziada|ziyada|upar|oopar|uper|oper|mehen?ga|mehen?gi|mehen?gay))', q)
    if m:
        result['price_min'] = float(m.group(1))
        return result
    m = re.search(r'(\d+)\s*سے\s*(?:زیادہ|اوپر|مہنگا|مہنگی|مہنگے)', q)
    if m:
        result['price_min'] = float(m.group(1))
        return result

    # BETWEEN patterns
    m = re.search(r'(\d+)\s*(?:se|to|aur|سے|اور|-|–)\s*(\d+)\s*(?:ke?\s*(?:beech|darmiyan|bich)|کے\s*(?:درمیان|بیچ))?', q)
    if m:
        v1, v2 = float(m.group(1)), float(m.group(2))
        # Only treat as range if both look like prices (> 100)
        if v1 >= 100 and v2 >= 100 and v1 != v2:
            result['price_min'] = min(v1, v2)
            result['price_max'] = max(v1, v2)

    return result


class RomanUrduSearchView(APIView):
    """
    AI-powered search using OpenRouter Nemotron model.
    Accepts Urdu script, Roman Urdu, and English queries.
    Translates via LLM, extracts product tags, and returns matching products.
    """
    permission_classes = [AllowAny]

    # Color aliases: maps common Urdu/Roman Urdu color words to DB color values
    COLOR_ALIASES = {
        # Urdu script
        'لال': ['red', 'maroon', 'coral'],
        'نیلا': ['blue', 'navy', 'dark blue', 'teal blue', 'asmani blue', 'light blue', 'teal'],
        'سفید': ['white', 'off white'],
        'کالا': ['black'],
        'بھورا': ['brown', 'dark brown', 'chocolate brown', 'burnt orange'],
        'پیلا': ['yellow', 'mustard', 'mustard yellow', 'spectra yellow', 'lime yellow', 'light yellow'],
        'گلابی': ['pink', 'mauve pink', 'coral'],
        'سبز': ['green', 'sage green', 'light sage green', 'olive', 'light pistachio', 'teal'],
        'سلیٹی': ['grey', 'light grey'],
        'جامنی': ['purple', 'maroon'],
        # Roman Urdu
        'laal': ['red', 'maroon', 'coral'],
        'neela': ['blue', 'navy', 'dark blue', 'teal blue', 'asmani blue', 'light blue', 'teal'],
        'safed': ['white', 'off white'],
        'kala': ['black'],
        'bhura': ['brown', 'dark brown', 'chocolate brown', 'burnt orange'],
        'peela': ['yellow', 'mustard', 'mustard yellow', 'spectra yellow', 'lime yellow', 'light yellow'],
        'gulabi': ['pink', 'mauve pink', 'coral'],
        'sabz': ['green', 'sage green', 'light sage green', 'olive', 'light pistachio', 'teal'],
        'hara': ['green', 'sage green', 'light sage green', 'olive', 'light pistachio', 'teal'],
        'sleti': ['grey', 'light grey'],
        'jamni': ['purple', 'maroon'],
        'narangi': ['burnt orange', 'coral'],
        # English common
        'red': ['red', 'maroon', 'coral'],
        'blue': ['blue', 'navy', 'dark blue', 'teal blue', 'asmani blue', 'light blue', 'teal'],
        'white': ['white', 'off white'],
        'black': ['black'],
        'brown': ['brown', 'dark brown', 'chocolate brown'],
        'yellow': ['yellow', 'mustard', 'mustard yellow', 'spectra yellow', 'lime yellow', 'light yellow'],
        'pink': ['pink', 'mauve pink'],
        'green': ['green', 'sage green', 'light sage green', 'olive', 'light pistachio', 'teal'],
        'grey': ['grey', 'light grey'],
        'gray': ['grey', 'light grey'],
        'purple': ['purple'],
        'maroon': ['maroon'],
        'orange': ['burnt orange', 'coral'],
        'navy': ['navy', 'dark blue'],
        'beige': ['beige', 'off white'],
        'olive': ['olive'],
        'teal': ['teal', 'teal blue'],
        'mustard': ['mustard', 'mustard yellow'],
    }

    # Item type aliases for category/subcategory mapping
    ITEM_TYPE_MAP = {
        # Maps item_type → (category filter, name search terms)
        'dupatta': ('dupatta', ['dupatta']),
        'دوپٹہ': ('dupatta', ['dupatta']),
        'hijab': ('accessories', ['hijab']),
        'حجاب': ('accessories', ['hijab']),
        'abaya': ('accessories', ['abaya']),
        'عبایا': ('accessories', ['abaya']),
        'suit': (None, ['suit']),
        'سوٹ': (None, ['suit']),
        'kurta': ('stitched', ['kameez', 'shirt', 'kurta']),
        'کرتا': ('stitched', ['kameez', 'shirt', 'kurta']),
        'qameez': ('stitched', ['kameez', 'shirt']),
        'قمیض': ('stitched', ['kameez', 'shirt']),
        'kameez': ('stitched', ['kameez', 'shirt']),
        'shirt': (None, ['shirt']),
        'shalwar': ('stitched', ['shalwar']),
        'شلوار': ('stitched', ['shalwar']),
        'trouser': (None, ['trouser']),
        'dress': (None, ['dress']),
    }

    def post(self, request):
        query = request.data.get('query', '').strip()

        if not query:
            return Response(
                {'error': 'Query is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Build prompt for the LLM
        prompt = f"""A customer of a Pakistani clothing store has typed the following search query:
"{query}"

This query may be in ANY of these three forms — handle all equally:
1. Native Urdu script  (e.g. "لال کرتا" = red kurta, "نیلا لان" = blue lawn)
2. Roman Urdu          (e.g. "laal kurta", "neela lawn suit", "mardana khaddar")
3. English             (e.g. "red kurta", "blue lawn", "men's suit")

IMPORTANT - Our store has these EXACT values in the database:
- Categories: stitched, unstitched, dupatta, accessories
- Colors: {', '.join(['Black', 'White', 'Off White', 'Brown', 'Dark Brown', 'Chocolate Brown', 'Beige', 'Grey', 'Light Grey', 'Blue', 'Dark Blue', 'Light Blue', 'Asmani Blue', 'Teal Blue', 'Teal', 'Navy', 'Pink', 'Mauve Pink', 'Coral', 'Red', 'Maroon', 'Purple', 'Green', 'Sage Green', 'Light Sage Green', 'Olive', 'Light Pistachio', 'Yellow', 'Mustard', 'Mustard Yellow', 'Spectra Yellow', 'Lime Yellow', 'Light Yellow', 'Burnt Orange', 'Multi'])}
- Fabrics: {', '.join(['Lawn', 'Cotton', 'Cotton Satin', 'Cotton Blend', 'Silk', 'Raw Silk', 'Viscose Raw Silk', 'Blended Grip Silk', 'Chiffon', 'Organza', 'Cross Hatch', 'Dobby', 'Khaddar', 'Jacquard', 'Wash & Wear', 'Nida', 'Crepe'])}
- Genders: male, female
- Price range: Rs. 850 to Rs. 6000
- Item types in store: shalwar kameez, shirt, suit (2-piece/3-piece), dupatta, hijab, abaya

Translate to English and extract product search tags.
Respond with ONLY a valid JSON object (no extra text, no markdown):
{{
  "english_query": "<translate the query to plain English>",
  "tags": {{
    "color": "<closest matching color from our store colors list, or null>",
    "fabric": "<closest matching fabric from our store fabrics list, or null>",
    "item_type": "<detected clothing item: kurta/qameez/shalwar/dupatta/hijab/abaya/shirt/suit/dress or null>",
    "gender": "<male/female or null>",
    "category": "<stitched/unstitched/dupatta/accessories or null>",
    "price_min": <minimum price as number or null>,
    "price_max": <maximum price as number or null>,
    "keywords": ["<keyword1>", "<keyword2>"]
  }}
}}

PRICE FILTERS — follow these exactly:
- "5000 se kam" / "5000 se sasti" / "5000 سے کم" / "under 5000"  → price_min: null, price_max: 5000
- "1500 se upar" / "1500 se mehenga" / "1500 سے اوپر" / "above 1500" → price_min: 1500, price_max: null
- "2000 se 3000" / "2000 سے 3000 کے درمیان" → price_min: 2000, price_max: 3000
- No price mentioned → both null

GENDER:
- "mardana" / "مردانہ" / "مرد" / "men" / "gents" → male
- "zanana" / "زنانہ" / "عورت" / "ladies" / "women" / "girls" / "larki" → female
"""

        # Call LLM
        llm_response = call_openrouter_llm(prompt)
        parsed = parse_llm_tags_response(llm_response)

        english_query = parsed.get('english_query', query)
        tags = parsed.get('tags', {})

        # If LLM failed, fall back to the existing NLP processor
        if not parsed:
            entities = nlp_processor.process_query(query)
            tags = {
                'color': entities.get('color'),
                'fabric': entities.get('fabric'),
                'item_type': entities.get('item_type'),
                'gender': entities.get('gender'),
                'category': 'stitched' if entities.get('stitched') is True else ('unstitched' if entities.get('stitched') is False else None),
                'price_min': None,
                'price_max': entities.get('price_max'),
                'keywords': [],
            }
            english_query = entities.get('normalized_query', query)

        # LOCAL TAG OVERRIDE: Use local regex for ALL tags — LLM can miss some
        local_tags = extract_tags_locally(query)
        if local_tags:
            # Override any tag the local parser found (more reliable than LLM)
            for key in ['gender', 'color', 'item_type', 'category', 'fabric']:
                if key in local_tags and (not tags.get(key) or local_tags[key]):
                    tags[key] = local_tags[key]
            # Price: always prefer local extraction
            if 'price_min' in local_tags:
                tags['price_min'] = local_tags['price_min']
                if 'price_max' not in local_tags:
                    tags['price_max'] = None
            if 'price_max' in local_tags:
                tags['price_max'] = local_tags['price_max']
                if 'price_min' not in local_tags:
                    tags['price_min'] = None

        # Build product queryset based on extracted tags
        queryset = Product.objects.filter(is_active=True)

        color = tags.get('color')
        fabric = tags.get('fabric')
        item_type = tags.get('item_type')
        gender = tags.get('gender')
        category = tags.get('category')
        price_min = tags.get('price_min')
        price_max = tags.get('price_max')
        keywords = tags.get('keywords', [])

        # --- ITEM TYPE FILTERING (with category mapping) ---
        if item_type:
            item_lower = item_type.lower()
            if item_lower in self.ITEM_TYPE_MAP:
                mapped_cat, search_terms = self.ITEM_TYPE_MAP[item_lower]
                if mapped_cat and not category:
                    category = mapped_cat
                name_q = Q()
                for term in search_terms:
                    name_q |= Q(name__icontains=term) | Q(name_urdu__icontains=term) | Q(subcategory__icontains=term) | Q(description__icontains=term)
                queryset = queryset.filter(name_q)
            else:
                queryset = queryset.filter(
                    Q(name__icontains=item_type) |
                    Q(name_urdu__icontains=item_type) |
                    Q(subcategory__icontains=item_type) |
                    Q(description__icontains=item_type)
                )

        # --- COLOR FILTERING (with aliases for fuzzy matching) ---
        if color:
            color_lower = color.lower()
            # Check if color has aliases
            matching_colors = self.COLOR_ALIASES.get(color_lower, [color])
            color_q = Q()
            for c in matching_colors:
                color_q |= Q(color__iexact=c)
            # Also try partial match
            color_q |= Q(color__icontains=color)
            queryset = queryset.filter(color_q)

        # --- FABRIC FILTERING ---
        if fabric:
            queryset = queryset.filter(fabric__icontains=fabric)

        # --- GENDER FILTERING ---
        if gender:
            gender_lower = gender.lower()
            if gender_lower in ['male', 'men', 'mard', 'مرد', 'مردانہ', 'gents']:
                queryset = queryset.filter(gender='male')
            elif gender_lower in ['female', 'women', 'عورت', 'زنانہ', 'ladies', 'larki']:
                queryset = queryset.filter(gender='female')
            else:
                queryset = queryset.filter(gender__icontains=gender)

        # --- CATEGORY FILTERING ---
        if category:
            queryset = queryset.filter(category__icontains=category)

        # --- PRICE FILTERING ---
        if price_min:
            try:
                queryset = queryset.filter(price__gte=float(price_min))
            except (ValueError, TypeError):
                pass

        if price_max:
            try:
                queryset = queryset.filter(price__lte=float(price_max))
            except (ValueError, TypeError):
                pass

        # Check if we have any specific attribute filters
        has_attribute_filters = any([item_type, color, fabric, gender, category])
        has_price_filters = price_min or price_max

        # If no filters at all, do a broad keyword search on both English and Urdu names
        if not has_attribute_filters and not has_price_filters:
            broad_q = Q()
            search_terms = [english_query, query] + keywords  # include original query for Urdu
            for term in search_terms:
                if term:
                    broad_q |= (
                        Q(name__icontains=term) |
                        Q(name_urdu__icontains=term) |
                        Q(description__icontains=term) |
                        Q(color__icontains=term) |
                        Q(fabric__icontains=term) |
                        Q(subcategory__icontains=term)
                    )
            if broad_q:
                queryset = Product.objects.filter(is_active=True).filter(broad_q)

        # Only use keywords as a fallback when attribute filters returned no results
        if keywords and has_attribute_filters and not queryset.exists():
            kw_q = Q()
            for kw in keywords:
                kw_q |= Q(name__icontains=kw) | Q(name_urdu__icontains=kw) | Q(description__icontains=kw)
            queryset = Product.objects.filter(is_active=True).filter(kw_q)

            # Re-apply price constraints on fallback results
            if price_min:
                try:
                    queryset = queryset.filter(price__gte=float(price_min))
                except (ValueError, TypeError):
                    pass
            if price_max:
                try:
                    queryset = queryset.filter(price__lte=float(price_max))
                except (ValueError, TypeError):
                    pass

        queryset = queryset.order_by('-created_at')
        results = queryset[:30]
        serializer = ProductListSerializer(results, many=True)

        return Response({
            'original_query': query,
            'english_query': english_query,
            'detected_tags': tags,
            'results_count': queryset.count(),
            'results': serializer.data,
        })


class TextSearchView(APIView):
    """Handle text-based search queries"""
    permission_classes = [AllowAny]

    def post(self, request):
        query = request.data.get('query', '')
        language = request.data.get('language', 'english')

        if not query:
            return Response(
                {'error': 'Query is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Process query with NLP
        entities = nlp_processor.process_query(query)

        # Build database query
        queryset = Product.objects.filter(is_active=True)

        # Apply filters based on extracted entities
        if entities['item_type']:
            queryset = queryset.filter(
                Q(name__icontains=entities['item_type']) |
                Q(subcategory__icontains=entities['item_type'])
            )

        if entities['color']:
            queryset = queryset.filter(color__icontains=entities['color'])

        if entities['fabric']:
            queryset = queryset.filter(fabric__icontains=entities['fabric'])

        if entities['gender']:
            queryset = queryset.filter(gender=entities['gender'])

        if entities['stitched'] is not None:
            category = 'stitched' if entities['stitched'] else 'unstitched'
            queryset = queryset.filter(category=category)

        if entities['price_max']:
            queryset = queryset.filter(price__lte=entities['price_max'])

        # Apply sorting
        if entities['sort_by'] == 'trending':
            try:
                from analytics.services import get_trending_product_ids
                trending_ids = get_trending_product_ids(days=7)
                queryset = queryset.filter(product_id__in=trending_ids)
            except:
                pass
        else:
            queryset = queryset.order_by(entities['sort_by'])

        # Serialize results
        serializer = ProductListSerializer(queryset[:20], many=True)

        return Response({
            'query': query,
            'parsed_entities': entities,
            'results_count': queryset.count(),
            'results': serializer.data
        })


class VoiceSearchView(APIView):
    """Handle voice-based search queries"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        # For now, we'll accept text transcript directly
        # In production, integrate with Google Cloud Speech-to-Text
        transcript = request.data.get('transcript', '')
        language = request.data.get('language', 'urdu')

        if not transcript:
            return Response(
                {'error': 'Transcript is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Process transcribed text with NLP
        entities = nlp_processor.process_query(transcript)

        # Build and execute search query (same as text search)
        queryset = Product.objects.filter(is_active=True)

        if entities['item_type']:
            queryset = queryset.filter(
                Q(name__icontains=entities['item_type']) |
                Q(subcategory__icontains=entities['item_type'])
            )

        if entities['color']:
            queryset = queryset.filter(color__icontains=entities['color'])

        if entities['fabric']:
            queryset = queryset.filter(fabric__icontains=entities['fabric'])

        if entities['gender']:
            queryset = queryset.filter(gender=entities['gender'])

        if entities['stitched'] is not None:
            category = 'stitched' if entities['stitched'] else 'unstitched'
            queryset = queryset.filter(category=category)

        if entities['price_max']:
            queryset = queryset.filter(price__lte=entities['price_max'])

        queryset = queryset.order_by(entities['sort_by'])

        serializer = ProductListSerializer(queryset[:20], many=True)

        return Response({
            'transcript': transcript,
            'parsed_entities': entities,
            'results_count': queryset.count(),
            'results': serializer.data
        })


import unicodedata

def levenshtein_distance(s1: str, s2: str) -> int:
    """
    Calculate the standard Levenshtein edit distance between two strings.
    """
    if len(s1) < len(s2):
        return levenshtein_distance(s2, s1)
    if len(s2) == 0:
        return len(s1)
    previous_row = list(range(len(s2) + 1))
    for i, c1 in enumerate(s1):
        current_row = [i + 1]
        for j, c2 in enumerate(s2):
            insertions = previous_row[j + 1] + 1
            deletions = current_row[j] + 1
            substitutions = previous_row[j] + (c1 != c2)
            current_row.append(min(insertions, deletions, substitutions))
        previous_row = current_row
    return previous_row[-1]

def calculate_similarity(name1: str, name2: str) -> float:
    """
    Calculate normalized Levenshtein similarity ratio between two names.
    Returns a float in [0.0, 1.0] where 1.0 = identical strings.
    Both names should already be normalized before calling this function.
    """
    if not name1 and not name2:
        return 1.0
    if not name1 or not name2:
        return 0.0
    dist = levenshtein_distance(name1, name2)
    max_len = max(len(name1), len(name2))
    return 1.0 - (dist / max_len)

def normalize_name(name: str) -> str:
    """
    Normalize a name for similarity comparison:
    1. Lowercase
    2. Remove accents/diacritics (NFD decomposition + strip combining chars)
    3. Remove extra whitespace
    4. Strip leading/trailing whitespace
    """
    if not name:
        return ''
    name = name.lower().strip()
    nfd = unicodedata.normalize('NFD', name)
    without_accents = ''.join(c for c in nfd if unicodedata.category(c) != 'Mn')
    normalized = ' '.join(without_accents.split())
    return normalized


def check_duplicate(full_name: str, age: int, cedula: str = None) -> dict:
    """
    Check whether a missing person report is a potential duplicate of an existing record.

    Logic:
    1. If cedula provided → exact match with status='missing' → definite duplicate (similarity=1.0)
    2. Name similarity > 0.85 AND age within ±2 years AND status='missing' → probable duplicate
    3. Otherwise → not a duplicate

    Args:
        full_name: The reported person's full name.
        age: The reported person's age.
        cedula: Optional Venezuelan cedula number.

    Returns:
        dict with keys:
            - is_duplicate (bool)
            - existing_person (MissingPerson | None)
            - similarity (float 0.0–1.0)
            - match_reason (str | None)
    """
    from apps.missing_people.models import MissingPerson

    # 1. Cedula exact match
    if cedula:
        cedula_clean = cedula.strip().upper()
        existing = MissingPerson.objects.filter(
            cedula=cedula_clean,
            status='missing',
        ).first()
        if existing:
            return {
                'is_duplicate': True,
                'existing_person': existing,
                'similarity': 1.0,
                'match_reason': 'cedula_exact',
            }

    # 2. Name + age similarity check
    normalized_input = normalize_name(full_name)

    # Pre-filter by age range to reduce comparison set
    candidates = MissingPerson.objects.filter(
        age__gte=age - 2,
        age__lte=age + 2,
        status='missing',
    ).only('id', 'full_name', 'age', 'status')

    best_match = None
    best_similarity = 0.0

    for candidate in candidates:
        normalized_candidate = normalize_name(candidate.full_name)
        sim = calculate_similarity(normalized_input, normalized_candidate)

        if sim > best_similarity:
            best_similarity = sim
            best_match = candidate

    if best_similarity >= 0.85 and best_match is not None:
        return {
            'is_duplicate': True,
            'existing_person': best_match,
            'similarity': round(best_similarity, 4),
            'match_reason': 'name_age_similarity',
        }

    return {
        'is_duplicate': False,
        'existing_person': None,
        'similarity': round(best_similarity, 4),
        'match_reason': None,
    }

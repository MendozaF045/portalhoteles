const DIACRITICS_REGEX = new RegExp('[̀-ͯ]', 'g');

function slugify(text) {
  return text
    .toString()
    .normalize('NFD')
    .replace(DIACRITICS_REGEX, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function generateUniqueSlug(db, nombre) {
  const base = slugify(nombre) || 'hotel';
  const exists = db.prepare('SELECT 1 FROM hoteles WHERE slug = ?');

  let slug = base;
  let suffix = 2;
  while (exists.get(slug)) {
    slug = `${base}-${suffix}`;
    suffix += 1;
  }
  return slug;
}

module.exports = { slugify, generateUniqueSlug };

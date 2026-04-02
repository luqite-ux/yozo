/**
 * GROQ：与 studio/schemaTypes 对齐。
 * 列表默认：未定义 isPublished 视为 true；isPublished == false 则前台隐藏（文档需已发布）。
 */

const published = `(!defined(isPublished) || isPublished == true)`;
const categoryVisible = `(!defined(isVisible) || isVisible == true) && ${published}`;

/** @type {string} */
export const siteSettingsQuery = `*[_type == "siteSettings"][0]{
  ...,
  "seoTitleResolved": coalesce(defaultSeo.seoTitle, seoTitle),
  "seoDescriptionResolved": coalesce(defaultSeo.seoDescription, seoDescription),
  "seoImageUrl": coalesce(defaultSeo.ogImage.asset->url, seoImage.asset->url),
  "ogImageUrl": coalesce(defaultSeo.ogImage.asset->url, seoImage.asset->url),
  "shareImageUrl": coalesce(defaultSeo.ogImage.asset->url, seoImage.asset->url),
  "logoUrl": logo.asset->url,
  "faviconUrl": favicon.asset->url,
  defaultSeo,
  socialLinks,
  headerCta,
  mainNavigation,
  footerCopyright,
  footerTagline,
  footerNote,
  contactWhatsapp,
  localeDefault
}`;

const productProjection = `
  _id,
  name,
  title,
  description,
  excerpt,
  packaging,
  supportOem,
  skinType,
  efficacy,
  oemDesc,
  ingredients,
  tags,
  sortOrder,
  isFeatured,
  body,
  specifications,
  applicationScenarios,
  gallery,
  "slug": slug.current,
  "mainImageUrl": mainImage.asset->url,
  "imageUrl": coalesce(mainImage.asset->url, image.asset->url, featuredImage.asset->url),
  "category": category->{
    _id,
    "title": title,
    "slug": slug.current
  },
  "ingredientsList": ingredients[]{
    name,
    "desc": description,
    description,
    text,
    detail
  },
  "tagsList": tags,
  "galleryUrls": gallery[].asset->url
`;

/** @type {string} */
export const homePageQuery = `*[_type == "homePage"][0]{
  ...,
  hero{
    title,
    subtitle,
    trustBadge,
    primaryCtaLabel,
    primaryCtaUrl,
    secondaryCtaLabel,
    secondaryCtaUrl,
    backgroundVideoUrl,
    "backgroundImageUrl": backgroundImage.asset->url
  },
  "heroImageUrl": coalesce(hero.backgroundImage.asset->url, heroImage.asset->url),
  featuredProducts[]->{
    ${productProjection}
  },
  featuredCaseStudies[]->{
    _id,
    title,
    excerpt,
    industry,
    tags,
    body,
    sortOrder,
    isFeatured,
    "slug": slug.current,
    "coverUrl": coalesce(coverImage.asset->url, cover.asset->url),
    "galleryUrls": gallery[].asset->url,
    seo,
    "seoOgImageUrl": seo.ogImage.asset->url
  },
  featuredFaqs[]->{
    _id,
    question,
    answer,
    sortOrder,
    showOnHome,
    category
  },
  faqSectionTitle,
  ctaSection,
  sections,
  seo,
  "seoOgImageUrl": seo.ogImage.asset->url
}`;

/** @type {string} */
export const productCategoriesQuery = `*[_type == "productCategory" && ${categoryVisible}] | order(coalesce(sortOrder, 0) asc, title asc) {
  ...,
  "slug": slug.current,
  "parentId": parent._ref,
  "coverImageUrl": coverImage.asset->url
}`;

/** @type {string} */
export const productsQuery = `*[_type == "product" && ${published}] | order(coalesce(sortOrder, 0) asc, _updatedAt desc) {
  ${productProjection}
}`;

/** @type {string} */
export const faqsQuery = `*[_type == "faq" && ${published}] | order(coalesce(sortOrder, 0) asc, _createdAt asc) {
  ...,
  "slug": slug.current,
  question,
  answer,
  category,
  isFeatured,
  showOnHome
}`;

/** @type {string} */
export const postsQuery = `*[_type == "post" && ${published}] | order(coalesce(publishedAt, _createdAt) desc) {
  _id,
  title,
  slug,
  headline,
  excerpt,
  summary,
  blurb,
  readTime,
  readingTime,
  views,
  viewCount,
  publishedAt,
  body,
  plainBody,
  categoryLabel,
  mainImage,
  coverImage,
  image,
  category,
  tags,
  articleCategory,
  relatedFaqs,
  isFeatured,
  "slug": slug.current,
  "mainImageUrl": mainImage.asset->url,
  "coverUrl": coalesce(mainImage.asset->url, coverImage.asset->url, image.asset->url),
  "img": coalesce(mainImage.asset->url, coverImage.asset->url, image.asset->url),
  "categoryTitle": coalesce(
    category,
    categoryLabel,
    category->title,
    category->name,
    articleCategory->title,
    articleCategory->name
  ),
  "articleFaqs": coalesce(
    relatedFaqs[]{ question, answer },
    relatedFaqs
  ),
  seo,
  "seoOgImageUrl": seo.ogImage.asset->url
}`;

/** @type {string} */
export const caseStudiesQuery = `*[_type == "caseStudy" && ${published}] | order(coalesce(sortOrder, 0) asc, _updatedAt desc) {
  _id,
  title,
  excerpt,
  industry,
  tags,
  body,
  sortOrder,
  isFeatured,
  "slug": slug.current,
  "coverUrl": coalesce(coverImage.asset->url, cover.asset->url),
  "galleryUrls": gallery[].asset->url,
  seo,
  "seoOgImageUrl": seo.ogImage.asset->url
}`;

/** @type {string} */
export const simplePagesQuery = `*[_type == "simplePage" && ${published}] | order(title asc) {
  _id,
  title,
  excerpt,
  body,
  banner,
  "slug": slug.current,
  "bannerBgUrl": banner.backgroundImage.asset->url,
  seo,
  "seoOgImageUrl": seo.ogImage.asset->url,
  seoTitle,
  seoDescription
}`;

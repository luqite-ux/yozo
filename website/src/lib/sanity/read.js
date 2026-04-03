import { getSanityClient } from './client.js';
import {
  siteSettingsQuery,
  homePageQuery,
  aboutPageQuery,
  productCategoriesQuery,
  productsQuery,
  faqsQuery,
  postsQuery,
  caseStudiesQuery,
  simplePagesQuery,
} from './queries.js';
import {
  mapSanityProduct,
  mapSanityFaq,
  mapSanityPost,
  mapSanityCaseStudy,
  mapSanitySimplePage,
  productCategoryDocsToLabels,
  buildProductCategoryTabs,
  buildArticleCategoryTabs,
  mapSiteSettingsForHome,
  mergeHomePageIntoSiteSettings,
  mapAboutPageFromSanity,
} from './mappers.js';

export function readSiteSettings() {
  return getSanityClient().fetch(siteSettingsQuery);
}

export function readProductCategories() {
  return getSanityClient().fetch(productCategoriesQuery);
}

export function readProducts() {
  return getSanityClient().fetch(productsQuery);
}

export function readFaqs() {
  return getSanityClient().fetch(faqsQuery);
}

export function readPosts() {
  return getSanityClient().fetch(postsQuery);
}

export function readCaseStudies() {
  return getSanityClient().fetch(caseStudiesQuery);
}

export function readSimplePages() {
  return getSanityClient().fetch(simplePagesQuery);
}

/**
 * 前台 CmsContext：仅从 Sanity 拉取并映射为页面使用的结构。
 */
export async function readCmsPayloadFromSanity() {
  const client = getSanityClient();
  const [rawSettings, rawHome, rawAbout, rawPcat, rawProducts, rawFaqs, rawPosts, rawCases, rawPages] =
    await Promise.all([
      client.fetch(siteSettingsQuery),
      client.fetch(homePageQuery),
      client.fetch(aboutPageQuery),
      client.fetch(productCategoriesQuery),
      client.fetch(productsQuery),
      client.fetch(faqsQuery),
      client.fetch(postsQuery),
      client.fetch(caseStudiesQuery),
      client.fetch(simplePagesQuery),
    ]);

  const mappedSettings = mapSiteSettingsForHome(rawSettings);
  const siteSettings = mergeHomePageIntoSiteSettings(mappedSettings, rawHome);
  const pcatLabels = productCategoryDocsToLabels(rawPcat);
  const products = rawProducts.map(mapSanityProduct);
  const faqs = rawFaqs.map(mapSanityFaq);
  const articles = rawPosts.map(mapSanityPost);
  const caseStudies = rawCases.map(mapSanityCaseStudy);
  const simplePages = rawPages.map(mapSanitySimplePage);
  const productCategories = buildProductCategoryTabs(rawSettings, pcatLabels);
  const articleCategories = buildArticleCategoryTabs(rawSettings, articles);

  return {
    siteSettings,
    aboutPage: mapAboutPageFromSanity(rawAbout),
    products,
    faqs,
    articles,
    caseStudies,
    simplePages,
    productCategories,
    articleCategories,
  };
}

export function readSiteContentBundle() {
  const client = getSanityClient();
  return Promise.all([
    client.fetch(siteSettingsQuery),
    client.fetch(homePageQuery),
    client.fetch(productCategoriesQuery),
    client.fetch(productsQuery),
    client.fetch(faqsQuery),
    client.fetch(postsQuery),
    client.fetch(caseStudiesQuery),
    client.fetch(simplePagesQuery),
  ]).then(
    ([siteSettings, homePage, productCategories, products, faqs, posts, caseStudies, simplePages]) => ({
      siteSettings,
      homePage,
      productCategories,
      products,
      faqs,
      posts,
      caseStudies,
      simplePages,
    }),
  );
}

const service = require("../services/content.service");
const searchService = require("../services/search.service");
const { sendSuccess } = require("../utils/response");

const params = (req) => req.validatedParams || req.params;
const query = (req) => req.validatedQuery || req.query;
const reply = (operation, args = () => []) => async (req, res) =>
  sendSuccess(res, await service[operation](...args(req)));

const getPublicSettings = reply("getPublicSettings");
const getPublicHome = reply("getPublicHomeBundle");
const searchPublic = async (req, res) =>
  sendSuccess(res, await searchService.searchPublic(query(req)));
const getAdminSettings = reply("getAdminSettings");
const updateSettings = reply("updateSettings", (req) => [req.body, req]);
const getPublicNavigation = reply("getPublicNavigation");
const listNavigation = reply("listResource", (req) => ["navigation", query(req)]);
const listPages = reply("listPages", (req) => [query(req)]);
const getAdminPage = reply("getAdminPage", (req) => [params(req).id]);
const createPage = reply("createPage", (req) => [req.body, req]);
const updatePage = reply("updatePage", (req) => [params(req).id, req.body, req]);
const deletePage = reply("deletePage", (req) => [params(req).id, req]);
const restorePage = reply("restorePage", (req) => [params(req).id, req]);
const publishPage = reply("publishPage", (req) => [params(req).id, req]);
const updatePageSections = reply("updatePageSections", (req) => [params(req).id, req.body.sections, req]);
const getPublicPages = reply("getPublicPages", (req) => [query(req)]);
const getPublicPage = reply("getPublicPage", (req) => [params(req).slug]);
const getPublicBanners = reply("getPublicBanners");
const getPublicPackages = reply("getPublicPackages", (req) => [query(req)]);
const getPublicPackage = reply("getPublicPackage", (req) => [params(req).slug]);
const getPublicGallery = reply("getPublicGallery");
const listAdminMedia = reply("listAdminMedia", (req) => [query(req)]);
const registerMedia = reply("registerMedia", (req) => [req.body, req]);
const uploadMedia = reply("uploadMedia", (req) => [req.file, req.body || {}, req]);
const softDeleteMedia = reply("softDeleteMedia", (req) => [params(req).id, req]);
const getPublicPolicy = reply("getPublicPolicy", (req) => [params(req).slug]);
const getPublicBlogs = reply("getPublicBlogs", (req) => [query(req)]);
const getPublicBlog = reply("getPublicBlog", (req) => [params(req).slug]);
const publishBlog = reply("publishBlog", (req) => [params(req).id, req]);
const getPublicFacilities = reply("getPublicFacilities", (req) => [query(req)]);
const getPublicFacility = reply("getPublicFacility", (req) => [params(req).slug]);
const getRestaurant = reply("getRestaurant");
const getAdminRestaurant = reply("getAdminRestaurant");
const saveRestaurant = reply("saveRestaurant", (req) => [req.body, req]);
const getPublicEvents = reply("getPublicEvents");
const getPublicEvent = reply("getPublicEvent", (req) => [params(req).slug]);
const getPublicAttractions = reply("getPublicAttractions", (req) => [query(req)]);
const getPublicAttraction = reply("getPublicAttraction", (req) => [params(req).slug]);
const getPublicFaqs = reply("getPublicFaqs");
const getPublicTestimonials = reply("getPublicTestimonials");
const subscribe = reply("subscribe", (req) => [req.body.email, req.body.captchaToken]);
const listNewsletter = reply("listNewsletter", (req) => [query(req)]);
const updateNewsletterStatus = reply("setNewsletterStatus", (req) => [params(req).id, req.body.status, req]);
const createInquiry = reply("createInquiry", (req) => [req.body, req]);
const listInquiries = reply("listInquiries", (req) => [query(req)]);
const getInquiry = reply("getInquiry", (req) => [params(req).id]);
const updateInquiry = reply("updateInquiry", (req) => [params(req).id, req.body, req]);
const setInquiryStatus = reply("setInquiryStatus", (req) => [params(req).id, req.body.status, req]);
const assignInquiry = reply("assignInquiry", (req) => [params(req).id, req.body.assignedToId, req]);

function listResource(name) { return reply("listResource", (req) => [name, query(req)]); }
function getResource(name) { return reply("getResource", (req) => [name, params(req).id]); }
function createResource(name) { return reply("createResource", (req) => [name, req.body, req]); }
function updateResource(name) { return reply("updateResource", (req) => [name, params(req).id, req.body, req]); }
function deleteResource(name) { return reply("deleteResource", (req) => [name, params(req).id, req]); }
function reorderResource(name) { return reply("reorderResource", (req) => [name, req.body.items, req]); }
function setTestimonialApproval() { return reply("setTestimonialApproval", (req) => [params(req).id, req.body.approvalStatus, req]); }

const listMenuCategories = reply("listMenuCategories", (req) => [query(req)]);
const listMenuItems = reply("listMenuItems", (req) => [query(req)]);
const createMenuCategory = reply("createMenuCategory", (req) => [req.body, req]);
const createMenuItem = reply("createMenuItem", (req) => [req.body, req]);
const updateMenuCategory = reply("mutateMenu", (req) => ["foodMenuCategory", "FoodMenuCategory", "update", params(req).id, req.body, req]);
const updateMenuItem = reply("mutateMenu", (req) => ["foodMenuItem", "FoodMenuItem", "update", params(req).id, req.body, req]);
const deleteMenuCategory = reply("mutateMenu", (req) => ["foodMenuCategory", "FoodMenuCategory", "delete", params(req).id, {}, req]);
const deleteMenuItem = reply("mutateMenu", (req) => ["foodMenuItem", "FoodMenuItem", "delete", params(req).id, {}, req]);

module.exports = {
  assignInquiry,
  createInquiry,
  createMenuCategory,
  createMenuItem,
  createPage,
  createResource,
  getResource,
  deleteMenuCategory,
  deleteMenuItem,
  deletePage,
  deleteResource,
  restorePage,
  getAdminPage,
  getAdminRestaurant,
  getAdminSettings,
  getInquiry,
  getPublicAttraction,
  getPublicAttractions,
  getPublicBanners,
  getPublicBlog,
  getPublicBlogs,
  getPublicGallery,
  getPublicHome,
  getPublicPackage,
  getPublicPackages,
  getPublicEvent,
  getPublicEvents,
  getPublicFacilities,
  getPublicFacility,
  getPublicFaqs,
  getPublicNavigation,
  getPublicPage,
  getPublicPages,
  getPublicPolicy,
  getPublicSettings,
  getPublicTestimonials,
  getRestaurant,
  searchPublic,
  listAdminMedia,
  listInquiries,
  listMenuCategories,
  listMenuItems,
  listNewsletter,
  listNavigation,
  listPages,
  listResource,
  publishBlog,
  publishPage,
  registerMedia,
  softDeleteMedia,
  uploadMedia,
  reorderResource,
  saveRestaurant,
  setInquiryStatus,
  setTestimonialApproval,
  subscribe,
  updateInquiry,
  updateMenuCategory,
  updateMenuItem,
  updateNewsletterStatus,
  updatePage,
  updatePageSections,
  updateResource,
  updateSettings,
};
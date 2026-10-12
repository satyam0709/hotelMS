const express = require("express");
const controller = require("../controllers/content.controller");
const { requireAdminAuth } = require("../middleware/auth.middleware");
const { requirePermission } = require("../middleware/permission.middleware");
const { publicWriteLimiter } = require("../middleware/rateLimit.middleware");
const { singleMediaUpload } = require("../middleware/upload.middleware");
const { validateBody, validateParams, validateQuery } = require("../middleware/validate.middleware");
const validator = require("../validators/content.validator");

const publicRouter = express.Router();
const adminRouter = express.Router();
const allow = (permission) => requirePermission(permission);
const idParams = validateParams(validator.idParams);
const slugParams = validateParams(validator.slugParams);
const listQuery = validateQuery(validator.listQuery);

publicRouter.get("/settings", controller.getPublicSettings);
publicRouter.get("/search", validateQuery(validator.searchQuery), controller.searchPublic);
publicRouter.get("/navigation", controller.getPublicNavigation);
publicRouter.get("/pages", listQuery, controller.getPublicPages);
publicRouter.get("/pages/:slug", slugParams, controller.getPublicPage);
publicRouter.get("/banners", controller.getPublicBanners);
publicRouter.get("/packages", listQuery, controller.getPublicPackages);
publicRouter.get("/packages/:slug", slugParams, controller.getPublicPackage);
publicRouter.get("/gallery", controller.getPublicGallery);
publicRouter.get("/policies/:slug", slugParams, controller.getPublicPolicy);
publicRouter.get("/facilities", listQuery, controller.getPublicFacilities);
publicRouter.get("/facilities/:slug", slugParams, controller.getPublicFacility);
publicRouter.get("/restaurant", controller.getRestaurant);
publicRouter.get("/events", controller.getPublicEvents);
publicRouter.get("/events/:slug", slugParams, controller.getPublicEvent);
publicRouter.get("/attractions", listQuery, controller.getPublicAttractions);
publicRouter.get("/attractions/:slug", slugParams, controller.getPublicAttraction);
publicRouter.get("/faqs", controller.getPublicFaqs);
publicRouter.get("/testimonials", controller.getPublicTestimonials);
publicRouter.get("/blogs", listQuery, controller.getPublicBlogs);
publicRouter.get("/blogs/:slug", slugParams, controller.getPublicBlog);
publicRouter.post(
  "/newsletter/subscribe",
  publicWriteLimiter,
  validateBody(validator.subscription),
  controller.subscribe
);
publicRouter.post(
  "/inquiries",
  publicWriteLimiter,
  validateBody(validator.inquiry),
  controller.createInquiry
);

adminRouter.use(requireAdminAuth);
adminRouter.get("/settings", allow("settings.read"), controller.getAdminSettings);
adminRouter.patch("/settings", allow("settings.update"), validateBody(validator.settings), controller.updateSettings);

adminRouter.get("/navigation", allow("navigation.read"), listQuery, controller.listNavigation);
adminRouter.post("/navigation", allow("navigation.create"), validateBody(validator.navigation.create), controller.createResource("navigation"));
adminRouter.patch("/navigation/reorder", allow("navigation.update"), validateBody(validator.reorder), controller.reorderResource("navigation"));
adminRouter.patch("/navigation/:id", allow("navigation.update"), idParams, validateBody(validator.navigation.update), controller.updateResource("navigation"));
adminRouter.delete("/navigation/:id", allow("navigation.delete"), idParams, controller.deleteResource("navigation"));

adminRouter.get("/pages", allow("pages.read"), listQuery, controller.listPages);
adminRouter.post("/pages", allow("pages.create"), validateBody(validator.page.create), controller.createPage);
adminRouter.get("/pages/:id", allow("pages.read"), idParams, controller.getAdminPage);
adminRouter.patch("/pages/:id/publish", allow("pages.update"), idParams, controller.publishPage);
adminRouter.patch("/pages/:id/sections", allow("sections.update"), idParams, validateBody(validator.pageSections), controller.updatePageSections);
adminRouter.patch("/pages/:id", allow("pages.update"), idParams, validateBody(validator.page.update), controller.updatePage);
adminRouter.post("/pages/:id/restore", allow("pages.update"), idParams, controller.restorePage);
adminRouter.delete("/pages/:id", allow("pages.delete"), idParams, controller.deletePage);

adminRouter.get("/banners", allow("banners.read"), listQuery, controller.listResource("banners"));
adminRouter.post("/banners", allow("banners.create"), validateBody(validator.banner.create), controller.createResource("banners"));
adminRouter.patch("/banners/reorder", allow("banners.update"), validateBody(validator.reorder), controller.reorderResource("banners"));
adminRouter.get("/banners/:id", allow("banners.read"), idParams, controller.getResource("banners"));
adminRouter.patch("/banners/:id", allow("banners.update"), idParams, validateBody(validator.banner.update), controller.updateResource("banners"));
adminRouter.delete("/banners/:id", allow("banners.delete"), idParams, controller.deleteResource("banners"));

adminRouter.get("/packages", allow("packages.read"), listQuery, controller.listResource("packages"));
adminRouter.post("/packages", allow("packages.create"), validateBody(validator.package.create), controller.createResource("packages"));
adminRouter.patch("/packages/reorder", allow("packages.update"), validateBody(validator.reorder), controller.reorderResource("packages"));
adminRouter.get("/packages/:id", allow("packages.read"), idParams, controller.getResource("packages"));
adminRouter.patch("/packages/:id", allow("packages.update"), idParams, validateBody(validator.package.update), controller.updateResource("packages"));
adminRouter.delete("/packages/:id", allow("packages.delete"), idParams, controller.deleteResource("packages"));

adminRouter.get("/gallery/categories", allow("gallery.read"), listQuery, controller.listResource("galleryCategories"));
adminRouter.post("/gallery/categories", allow("gallery.create"), validateBody(validator.galleryCategory.create), controller.createResource("galleryCategories"));
adminRouter.patch("/gallery/categories/reorder", allow("gallery.update"), validateBody(validator.reorder), controller.reorderResource("galleryCategories"));
adminRouter.get("/gallery/categories/:id", allow("gallery.read"), idParams, controller.getResource("galleryCategories"));
adminRouter.patch("/gallery/categories/:id", allow("gallery.update"), idParams, validateBody(validator.galleryCategory.update), controller.updateResource("galleryCategories"));
adminRouter.delete("/gallery/categories/:id", allow("gallery.delete"), idParams, controller.deleteResource("galleryCategories"));

adminRouter.get("/gallery/items", allow("gallery.read"), listQuery, controller.listResource("galleryItems"));
adminRouter.post("/gallery/items", allow("gallery.create"), validateBody(validator.galleryItem.create), controller.createResource("galleryItems"));
adminRouter.patch("/gallery/items/reorder", allow("gallery.update"), validateBody(validator.reorder), controller.reorderResource("galleryItems"));
adminRouter.get("/gallery/items/:id", allow("gallery.read"), idParams, controller.getResource("galleryItems"));
adminRouter.patch("/gallery/items/:id", allow("gallery.update"), idParams, validateBody(validator.galleryItem.update), controller.updateResource("galleryItems"));
adminRouter.delete("/gallery/items/:id", allow("gallery.delete"), idParams, controller.deleteResource("galleryItems"));

adminRouter.get("/policies", allow("policies.read"), listQuery, controller.listResource("policies"));
adminRouter.post("/policies", allow("policies.create"), validateBody(validator.policy.create), controller.createResource("policies"));
adminRouter.patch("/policies/:id", allow("policies.update"), idParams, validateBody(validator.policy.update), controller.updateResource("policies"));
adminRouter.delete("/policies/:id", allow("policies.delete"), idParams, controller.deleteResource("policies"));

adminRouter.get("/facilities", allow("facilities.read"), listQuery, controller.listResource("facilities"));
adminRouter.post("/facilities", allow("facilities.create"), validateBody(validator.facility.create), controller.createResource("facilities"));
adminRouter.patch("/facilities/reorder", allow("facilities.update"), validateBody(validator.reorder), controller.reorderResource("facilities"));
adminRouter.patch("/facilities/:id", allow("facilities.update"), idParams, validateBody(validator.facility.update), controller.updateResource("facilities"));
adminRouter.delete("/facilities/:id", allow("facilities.delete"), idParams, controller.deleteResource("facilities"));

adminRouter.get("/restaurant", allow("restaurant.read"), controller.getAdminRestaurant);
adminRouter.patch("/restaurant", allow("restaurant.update"), validateBody(validator.restaurant.update), controller.saveRestaurant);
adminRouter.get("/restaurant/menu-categories", allow("restaurant.read"), listQuery, controller.listMenuCategories);
adminRouter.post("/restaurant/menu-categories", allow("restaurant.create"), validateBody(validator.menuCategory.create), controller.createMenuCategory);
adminRouter.patch("/restaurant/menu-categories/:id", allow("restaurant.update"), idParams, validateBody(validator.menuCategory.update), controller.updateMenuCategory);
adminRouter.delete("/restaurant/menu-categories/:id", allow("restaurant.delete"), idParams, controller.deleteMenuCategory);
adminRouter.get("/restaurant/menu-items", allow("restaurant.read"), listQuery, controller.listMenuItems);
adminRouter.post("/restaurant/menu-items", allow("restaurant.create"), validateBody(validator.menuItem.create), controller.createMenuItem);
adminRouter.patch("/restaurant/menu-items/:id", allow("restaurant.update"), idParams, validateBody(validator.menuItem.update), controller.updateMenuItem);
adminRouter.delete("/restaurant/menu-items/:id", allow("restaurant.delete"), idParams, controller.deleteMenuItem);

adminRouter.get("/events", allow("events.read"), listQuery, controller.listResource("events"));
adminRouter.post("/events", allow("events.create"), validateBody(validator.event.create), controller.createResource("events"));
adminRouter.patch("/events/:id", allow("events.update"), idParams, validateBody(validator.event.update), controller.updateResource("events"));
adminRouter.delete("/events/:id", allow("events.delete"), idParams, controller.deleteResource("events"));

adminRouter.get("/attractions", allow("attractions.read"), listQuery, controller.listResource("attractions"));
adminRouter.post("/attractions", allow("attractions.create"), validateBody(validator.attraction.create), controller.createResource("attractions"));
adminRouter.patch("/attractions/reorder", allow("attractions.update"), validateBody(validator.reorder), controller.reorderResource("attractions"));
adminRouter.patch("/attractions/:id", allow("attractions.update"), idParams, validateBody(validator.attraction.update), controller.updateResource("attractions"));
adminRouter.delete("/attractions/:id", allow("attractions.delete"), idParams, controller.deleteResource("attractions"));

adminRouter.get("/media", allow("media.read"), listQuery, controller.listAdminMedia);
adminRouter.post("/media/register", allow("media.upload"), validateBody(validator.mediaRegister), controller.registerMedia);
adminRouter.post("/media/upload", allow("media.upload"), singleMediaUpload("file"), controller.uploadMedia);
adminRouter.delete("/media/:id", allow("media.delete"), idParams, controller.softDeleteMedia);

adminRouter.get("/faq/categories", allow("faqs.read"), listQuery, controller.listResource("faqCategories"));
adminRouter.post("/faq/categories", allow("faqs.create"), validateBody(validator.faqCategory.create), controller.createResource("faqCategories"));
adminRouter.patch("/faq/categories/reorder", allow("faqs.update"), validateBody(validator.reorder), controller.reorderResource("faqCategories"));
adminRouter.get("/faq/categories/:id", allow("faqs.read"), idParams, controller.getResource("faqCategories"));
adminRouter.patch("/faq/categories/:id", allow("faqs.update"), idParams, validateBody(validator.faqCategory.update), controller.updateResource("faqCategories"));
adminRouter.delete("/faq/categories/:id", allow("faqs.delete"), idParams, controller.deleteResource("faqCategories"));
adminRouter.get("/faqs", allow("faqs.read"), listQuery, controller.listResource("faqs"));
adminRouter.post("/faqs", allow("faqs.create"), validateBody(validator.faq.create), controller.createResource("faqs"));
adminRouter.patch("/faqs/reorder", allow("faqs.update"), validateBody(validator.reorder), controller.reorderResource("faqs"));
adminRouter.get("/faqs/:id", allow("faqs.read"), idParams, controller.getResource("faqs"));
adminRouter.patch("/faqs/:id", allow("faqs.update"), idParams, validateBody(validator.faq.update), controller.updateResource("faqs"));
adminRouter.delete("/faqs/:id", allow("faqs.delete"), idParams, controller.deleteResource("faqs"));

adminRouter.get("/testimonials", allow("testimonials.read"), listQuery, controller.listResource("testimonials"));
adminRouter.post("/testimonials", allow("testimonials.create"), validateBody(validator.testimonial.create), controller.createResource("testimonials"));
adminRouter.patch("/testimonials/reorder", allow("testimonials.update"), validateBody(validator.reorder), controller.reorderResource("testimonials"));
adminRouter.get("/testimonials/:id", allow("testimonials.read"), idParams, controller.getResource("testimonials"));
adminRouter.patch("/testimonials/:id/approval", allow("testimonials.approve"), idParams, validateBody(validator.approval), controller.setTestimonialApproval());
adminRouter.patch("/testimonials/:id", allow("testimonials.update"), idParams, validateBody(validator.testimonial.update), controller.updateResource("testimonials"));
adminRouter.delete("/testimonials/:id", allow("testimonials.delete"), idParams, controller.deleteResource("testimonials"));

adminRouter.get("/blogs", allow("blogs.read"), listQuery, controller.listResource("blogs"));
adminRouter.post("/blogs", allow("blogs.create"), validateBody(validator.blog.create), controller.createResource("blogs"));
adminRouter.get("/blogs/:id", allow("blogs.read"), idParams, controller.getResource("blogs"));
adminRouter.patch("/blogs/:id/publish", allow("blogs.publish"), idParams, controller.publishBlog);
adminRouter.patch("/blogs/:id", allow("blogs.update"), idParams, validateBody(validator.blog.update), controller.updateResource("blogs"));
adminRouter.delete("/blogs/:id", allow("blogs.delete"), idParams, controller.deleteResource("blogs"));

adminRouter.get("/newsletter", allow("newsletter.read"), listQuery, controller.listNewsletter);
adminRouter.patch("/newsletter/:id", allow("newsletter.update"), idParams, validateBody(validator.newsletterStatus), controller.updateNewsletterStatus);

adminRouter.get("/inquiries", allow("inquiries.read"), listQuery, controller.listInquiries);
adminRouter.get("/inquiries/:id", allow("inquiries.read"), idParams, controller.getInquiry);
adminRouter.patch("/inquiries/:id/status", allow("inquiries.update"), idParams, validateBody(validator.inquiryStatus), controller.setInquiryStatus);
adminRouter.patch("/inquiries/:id/assign", allow("inquiries.assign"), idParams, validateBody(validator.inquiryAssignment), controller.assignInquiry);
adminRouter.patch("/inquiries/:id", allow("inquiries.update"), idParams, validateBody(validator.inquiryUpdate), controller.updateInquiry);

module.exports = { adminRouter, publicRouter };
import { cache } from "react";
import { apiGet, apiPost } from "@/lib/api/client";

export const getSettings = cache(async function getSettings() {
  return apiGet("/settings", { next: { revalidate: 120 } });
});

export const getNavigation = cache(async function getNavigation() {
  return apiGet("/navigation", { next: { revalidate: 120 } });
});

export const getBanners = cache(async function getBanners() {
  return apiGet("/banners", { next: { revalidate: 60 } });
});

export const getHome = cache(async function getHome() {
  return apiGet("/home", { next: { revalidate: 60 } });
});

export async function getPackages(query = {}) {
  return apiGet("/packages", { query, next: { revalidate: 60 } });
}

export async function getPackage(slug) {
  return apiGet(`/packages/${slug}`, { next: { revalidate: 60 } });
}

export async function getGallery() {
  return apiGet("/gallery", { next: { revalidate: 60 } });
}

export const getPublicPage = cache(async function getPublicPage(slug) {
  return apiGet(`/pages/${slug}`, { next: { revalidate: 60 } });
});

export async function getFacilities(query = {}) {
  return apiGet("/facilities", { query, next: { revalidate: 60 } });
}

export async function getFacility(slug) {
  return apiGet(`/facilities/${slug}`, { next: { revalidate: 60 } });
}

export async function getRestaurant() {
  return apiGet("/restaurant", { next: { revalidate: 60 } });
}

export async function getTestimonials() {
  return apiGet("/testimonials", { next: { revalidate: 60 } });
}

export async function getAttractions(query = {}) {
  return apiGet("/attractions", { query, next: { revalidate: 60 } });
}

export async function getAttraction(slug) {
  return apiGet(`/attractions/${slug}`, { next: { revalidate: 60 } });
}

export async function getEvents() {
  return apiGet("/events", { next: { revalidate: 60 } });
}

export async function getEvent(slug) {
  return apiGet(`/events/${slug}`, { next: { revalidate: 60 } });
}

export async function getFaqs() {
  return apiGet("/faqs", { next: { revalidate: 60 } });
}

export async function getBlogs(query = {}) {
  return apiGet("/blogs", { query, next: { revalidate: 60 } });
}

export async function getBlog(slug) {
  return apiGet(`/blogs/${slug}`, { next: { revalidate: 60 } });
}

export async function getPolicy(slug) {
  return apiGet(`/policies/${slug}`, { next: { revalidate: 120 } });
}

export async function subscribeNewsletter(email, captchaToken) {
  return apiPost("/newsletter/subscribe", {
    email,
    ...(captchaToken ? { captchaToken } : {}),
  });
}

export async function createInquiry(payload) {
  return apiPost("/inquiries", payload);
}

export async function createRestaurantReservation(payload) {
  return apiPost("/restaurant/reservations", payload);
}

export async function searchSite(q, query = {}) {
  return apiGet("/search", { query: { q, ...query }, cache: "no-store" });
}

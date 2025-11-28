// See https://observablehq.com/framework/config for documentation.
export default {
  // The app’s title; used in the sidebar and webpage titles.
  title: "💧Dunkbin Stats 2.0",

  // The pages and sections in the sidebar. If you don’t specify this option,
  // all pages will be listed in alphabetical order. Listing pages explicitly
  // lets you organize them into sections and have unlisted pages.
  pages: [
    {
      name: "Dunkbin Stats",
      pages: [
        { name: "Backpacks", path: "/backpacks" },
        { name: "Cosmetics", path: "/cosmetics" },
      ],
    },
    {
      name: "Stale Data",
      pages: [{ name: "CITBs and Winstreaks", path: "/winstreaks" }],
    },
    {
      name: "Cosmetic Trading",
      pages: [{ name: "Dupe finder", path: "/dupes" }],
    },
  ],

  // Content to add to the head of the page, e.g. for a favicon:
  head: '<link rel="icon" href="WUOTE.png" type="image/png" sizes="32x32">',

  // The path to the source root.
  root: "src",

  // Some additional configuration options and their defaults:
  theme: ["ocean-floor", "wide"],
  // header: "Dunkbin Stats 2.0 by WUOTE", // what to show in the header (HTML)  footer:
  footer:
    '<div style="display: flex; align-items: center; gap: 2px;">Made by<a href="https://www.twitch.tv/WUOTE"><img src="https://noita-bartender-images.acidflow.stream/images/logo/WUOTE_LOGO.svg" style="width:100px;"></a>',
  sidebar: true, // whether to show the sidebar
  toc: false, // whether to show the table of contents
  pager: false, // whether to show previous & next links in the footer
  output: "dist", // path to the output root for build
  search: false, // activate search
  linkify: true, // convert URLs in Markdown to links
  typographer: true, // smart quotes and other typographic improvements
  preserveExtension: false, // drop .html from URLs
  preserveIndex: false, // drop /index from URLs
  cleanUrls: true, // drop .html from URLs
};

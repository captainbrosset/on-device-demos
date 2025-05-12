export default async function(eleventyConfig) {
  eleventyConfig.addPassthroughCopy("src/static/");

  return {
    dir: {
      "input": "src",
      "output": "docs",
    },
    pathPrefix: "/on-device-demos/"
  }
};

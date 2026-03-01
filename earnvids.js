/**
 *  EarnVids plugin for Movian
 *
 *  Copyright (C) 2025
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 */

// Parse plugin.json
var plugin = JSON.parse(Plugin.manifest);
var PREFIX = plugin.id;
var localVersion = plugin.version;
var movResource = Plugin.path + "res/";
var LOGO = movResource + "logo.png";
var backgroundImage = movResource + "bg1.jpg";

var page = require("movian/page");
var http = require("movian/http");
var html = require("movian/html");
var settings = require("movian/settings");
var service = require("movian/service");
var popup = require("native/popup");
var io = require("native/io");

// API Configuration
var API_BASE = "https://earnvidsapi.com/api/file/list";
var API_KEY = "40912ieye28evteyidgbr";
var DECRYPT_WORKER = "https://worker-bitter-water.kissingremoking.workers.dev/";

// Category List
var category_list = [
  {
    title: "HD Movies",
    logo: "https://i.imgur.com/2cDnedi.png",
    description: "High Quality Tamil Movies",
    fld_id: 132101,
  },
  {
    title: "Tamil Dubbed",
    logo: "https://i.imgur.com/F2XfQCR.png",
    description: "Tamil Dubbed Hollywood Movies",
    fld_id: 132194,
  },
  {
    title: "In Cinemas",
    logo: "https://i.imgur.com/xyYyrWV.png",
    description: "Latest Theatre Releases",
    fld_id: 125432,
  },
  {
    title: "Tamil Old Movies",
    logo: "https://i.imgur.com/VHQ9liN.png",
    description: "Classic Tamil Movies",
    fld_id: 132193,
  },
  {
    title: "Malayalam",
    logo: "https://i.imgur.com/N5XJ6ra.png",
    description: "Malayalam Movies",
    fld_id: 132192,
  },
  {
    title: "Hindi",
    logo: "https://i.imgur.com/VHQ9liN.png",
    description: "Hindi Movies",
    fld_id: 132191,
  },
];

var blue = "6699CC",
  orange = "FFA500",
  red = "EE0000",
  green = "008B45";

var UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36";

// RichText Helper
RichText = function (text) {
  this.str = text.toString();
};
RichText.prototype.toRichString = function () {
  return this.str;
};

// Create service
service.create(plugin.title, PREFIX + ":start", "video", true, LOGO);

// Global settings
settings.globalSettings(plugin.id, plugin.title, LOGO, plugin.synopsis);

settings.createMultiOpt(
  "Proxy Server",
  "Select Proxy Server",
  [
    [0, "No Proxy", true],
    ["https://prx.kissingremoking.workers.dev/?url=", "Cloudflare Own Proxy"],
    ["https://cors-proxy.cluster.fun/", "cors-proxy"],
  ],
  function (v) {
    service.proxy = v;
  }
);

// HTTP Inspector for browser-like behavior
io.httpInspectorCreate(".*", function (ctrl) {
    // Attempt to get URL dynamically
  var url;
  if (typeof ctrl.getUrl === "function") {
    url = ctrl.getUrl();
  } else if (typeof ctrl.url === "string") {
    url = ctrl.url;
  } else if (ctrl.req && typeof ctrl.req.url === "string") {
    url = ctrl.req.url;
  }

  if (url) {
    console.log("Setting Host header for URL: " + url);
    var host = url.split("/")[2]; // host:port if present
    ctrl.setHeader("Host", host);
  }
  else {
    console.log("Unable to determine URL for setting Host header.");
  }

  console.log("Setting common headers", JSON.stringify(ctrl));


  ctrl.setHeader("User-Agent", UA);
  ctrl.setHeader("Accept", "*/*");
  ctrl.setHeader("Accept-Language", "en-US,en;q=0.9");
});

// Start page - Category listing
new page.Route(PREFIX + ":start", function (page) {
    checkupdate(page);
  page.loading = true;
  page.metadata.logo = LOGO;
  page.metadata.title = plugin.title;
  page.metadata.background = backgroundImage;
  page.metadata.backgroundAlpha = 0.2;
  page.model.contents = "grid";
  page.type = "directory";
  page.entries = 0;

  for (var i = 0; i < category_list.length; i++) {
    var category = category_list[i];
    var videoparam = {
      title: category.title,
      description: category.description,
      icon: category.logo,
      fld_id: category.fld_id,
    };
    page.appendItem(
      PREFIX + ":category:" + JSON.stringify(videoparam),
      "directory",
      videoparam
    );
    page.entries++;
  }

  page.loading = false;
});


//
function checkupdate(page) {
  page.options.createAction("update", "Update Earn Vids Movies", function () {
    popup.notify(
      "Updating, please wait for 10 seconds and click back ...",
      0xa
    );
    page.redirect("https://tllprm.thirumurthy.workers.dev/m7file/earnvids.zip");
  });

  try {
    resp = http
      .request(
        "https://tllprm.thirumurthy.workers.dev/m7update?type=Tamilearnvidsversion"
      )
      .toString();
    console.log(resp);
    if (resp) {
      var latestVersion = JSON.parse(resp).version;
      // Compare the versions
      console.log("local " + localVersion + " new " + latestVersion);
      popup.notify("local " + localVersion + " new " + latestVersion, 0xa);
      if (compareVersions(latestVersion, localVersion) > 0) {
        popup.notify(
          "New version of File Moon Movies " +
            latestVersion +
            " is available. Press right arrow on Dpad and click update File Moon Movies",
          0x9
        );
      }
    }
  } catch (error) {}
}

// Function to compare version numbers
function compareVersions(version1, version2) {
  var parts1 = version1.split(".");
  var parts2 = version2.split(".");
  for (var i = 0; i < 3; i++) {
    var part1 = parseInt(parts1[i], 10);
    var part2 = parseInt(parts2[i], 10);
    if (part1 > part2) {
      return 1;
    }
    if (part1 < part2) {
      return -1;
    }
  }
  return 0;
}

// Category page - Movie listing
new page.Route(PREFIX + ":category:(.*)", function (page, data) {
  page.loading = true;
  data = JSON.parse(data);
  
  page.metadata.logo = LOGO;
  page.metadata.title = PREFIX + " - " + data.title;
  page.metadata.background = backgroundImage;
  page.metadata.backgroundAlpha = 0.2;
  page.model.contents = "grid";
  page.type = "directory";
  page.entries = 0;

  var nextPage = 1;
  var perPage = 20;

  function loadMovies() {
    try {
      var url = API_BASE + "?key=" + API_KEY + "&per_page=" + perPage + "&fld_id=" + data.fld_id + "&page=" + nextPage;
      
      if (service.proxy != 0) {
        url = service.proxy + url;
      }

      console.log("Fetching: " + url);
      var resp = http.request(url).toString();
      var result = JSON.parse(resp);

      if (result.status === 200 && result.result && result.result.files) {
        var files = result.result.files;
        
        for (var i = 0; i < files.length; i++) {
          var movie = files[i];
          page.appendItem(
            PREFIX + ":movie:" + JSON.stringify(movie),
            "video",
            {
              title: decodeHtmlEntities(movie.title),
              description: decodeHtmlEntities(movie.title),
              icon: movie.thumbnail || movie.single_img || LOGO,
            }
          );
          page.entries++;
        }

        nextPage++;
        page.haveMore(files.length >= perPage);
      } else {
        page.haveMore(false);
      }
    } catch (e) {
      console.log("Error loading movies: " + e.message);
      page.haveMore(false);
    }
  }

  loadMovies();
  page.loading = false;
  page.asyncPaginator = loadMovies;
});

// Movie page - Video playback
new page.Route(PREFIX + ":movie:(.*)", function (page, data) {
  data = JSON.parse(data);
  page.type = "directory";
  page.loading = true;
  page.metadata.title = PREFIX + " | " + decodeHtmlEntities(data.title);
  page.metadata.thumbnail = LOGO;

  try {
    // Get video link
    var videoLink = getVideoLink(data.link);

    if (videoLink) {
      page.type = "video";
      
      // Get IMDB info
      var imdb = getIMDB(data.title);
      console.log("IMDB ID: " + (imdb.imdbID || "Not found"));
      var sources = [];
      sources.push({
          url: videoLink.match(/m3u8/) ? "hls:" + videoLink : videoLink,
          mimetype: videoLink.match(/m3u8/) ? "application/x-mpegURL" : "video/mp4",
        });

      page.source = "videoparams:" + JSON.stringify({
        title: decodeHtmlEntities(data.title),
        name: decodeHtmlEntities(data.title),
        icon: imdb.Poster || data.splash_img || data.single_img || LOGO,
        imdbid: imdb.imdbID || "",
        genre: imdb.Genre || "",
        year: imdb.Year || "",
        rating: imdb.imdbRating || "",
        description: new RichText(
          coloredStr("Released: ", orange) + (imdb.Released || "N/A") + "\n" +
          coloredStr("Director: ", orange) + (imdb.Director || "N/A") + "\n" +
          coloredStr("Writer: ", orange) + (imdb.Writer || "N/A") + "\n" +
          coloredStr("Actors: ", orange) + (imdb.Actors || "N/A") + "\n" +
          coloredStr("Plot: ", orange) + (imdb.Plot || "N/A")
        ),
        sources: sources
      });

      page.loading = false;
    } else {
      page.loading = false;
      page.error("Unable to find video URL");
    }
  } catch (e) {
    page.loading = false;
    page.error("Error: " + e.message);
    console.log("Movie page error: " + e.message);
  }
});

// ============= Helper Functions =============

/**
 * Get video link from file code
 */
function getVideoLink(videoLink) {
  try {
   
     // Find link
    resp = http.request(videoLink).toString();
    var gRegex = /}\('(.*)',(\d+),(\d+),'(.*)'.split/im;
    const match2 = resp.match(gRegex);
    if (match2) {
      videoLink = getm3uLink(
        match2[1],
        match2[2],
        match2[3],
        match2[4].split("|")
      );
      return videoLink;
    }
    
    
  } catch (e) {
    console.log("Error in getVideoLink: " + e.message);
    throw new Error("Failed to get video link: " + e.message);
  }
}

function getm3uLink(p, a, c, k, e, d) {
  while (c--) {
    if (k[c]) {
      p = p.replace(new RegExp("\\b" + c.toString(a) + "\\b", "g"), k[c]);
    }
  }
  
  // Hardcoded base URL
  var baseUrl = "https://minochinos.com";
  
  // Try to extract a `links` object
  try {
    var linksObj = null;
    var linksMatch = p.match(/var\s+links\s*=\s*(\{[^}]+(?:{[^}]*}[^}]*)*\})/i);
    if (linksMatch && linksMatch[1]) {
      var objStr = linksMatch[1];
      // Clean the string for JSON parsing
      try {
        objStr = objStr.replace(/(['"])?([a-zA-Z0-9_]+)\1\s*:/g, '"$2":')
                       .replace(/'/g, '"')
                       .replace(/,\s*\}/g, '}')    // Fixed: escaped }
                       .replace(/,\s*\]/g, ']');   // Fixed: escaped ]
        linksObj = JSON.parse(objStr);
      } catch (e) {
        // Fallback to eval if JSON.parse fails
        try {
          linksObj = eval('(' + linksMatch[1] + ')');
        } catch (e2) {
          console.log('Failed to parse links object');
          linksObj = null;
        }
      }
    }
    
    if (linksObj) {
      // Function to check URL accessibility
      function checkUrlAccessible(url) {
        try {
          var reqUrl = url;
          // Apply proxy if available
          if (typeof service !== 'undefined' && service && service.proxy && service.proxy != 0) {
            reqUrl = service.proxy + url;
          }
          
          // Try HEAD request
          var headResp = http.request(reqUrl, { method: "HEAD" });
          if (headResp && typeof headResp === 'object') {
            var status = headResp.status || headResp.statusCode || headResp.status_code;
            if (typeof status === 'string') status = parseInt(status, 10);
            if (status && status >= 200 && status < 400) {
              return true;
            }
          }
          
          // Try GET request as fallback
          try {
            var getResp = http.request(reqUrl, { method: "GET", timeout: 5000 });
            if (getResp && typeof getResp === 'object') {
              var body = getResp.toString();
              // Check for m3u8 content
              if (body && (body.indexOf('.m3u8') !== -1 || /^#EXTM3U/i.test(body.trim()) || 
                  body.indexOf('#EXT-X-VERSION') !== -1 || body.indexOf('#EXTINF') !== -1)) {
                return true;
              }
            }
          } catch (e) {
            // Ignore GET errors
          }
        } catch (e) {
          // Ignore errors
        }
        return false;
      }
      
      // Function to make URL absolute
      function makeAbsoluteUrl(url) {
        if (!url) return null;
        
        // Already absolute
        if (/^https?:\/\//i.test(url)) {
          return url;
        }
        
        // Protocol-relative (//example.com)
        if (url.indexOf('//') === 0) {
          return 'https:' + url;
        }
        
        // Relative path starting with /
        if (url.indexOf('/') === 0) {
          return baseUrl + url;
        }
        
        // Relative path without leading slash
        return baseUrl + '/' + url;
      }
      
      // Check hls4 first
      if (linksObj.hls4) {
        var hls4Url = makeAbsoluteUrl(linksObj.hls4);
        if (hls4Url && checkUrlAccessible(hls4Url)) {
          return hls4Url;
        }
      }
      
      // Fallback to hls3
      if (linksObj.hls3) {
        var hls3Url = makeAbsoluteUrl(linksObj.hls3);
        if (hls3Url && checkUrlAccessible(hls3Url)) {
          return hls3Url;
        }
      }
      
      // Fallback to hls2
      if (linksObj.hls2) {
        var hls2Url = makeAbsoluteUrl(linksObj.hls2);
        if (hls2Url && checkUrlAccessible(hls2Url)) {
          return hls2Url;
        }
      }
      
      // If none are accessible, return the first available URL
      if (linksObj.hls4) return makeAbsoluteUrl(linksObj.hls4);
      if (linksObj.hls3) return makeAbsoluteUrl(linksObj.hls3);
      if (linksObj.hls2) return makeAbsoluteUrl(linksObj.hls2);
    }
  } catch (err) {
    console.log('Error parsing links: ' + err.message);
  }
  
  // Fallback: look for m3u8 URLs in the page
  var m3u8Regex = /(https?:\/\/[^"\'\s]+\.m3u8[^"\'\s]*)/i;
  var m3u8Match = p.match(m3u8Regex);
  if (m3u8Match) return m3u8Match[1];
  
  // Alternative pattern
  var fileRegex = /file:\s*["']?(https?:\/\/[^"'\s]+\.(?:m3u8|m3u)[^"'\s]*)["']?/i;
  var fileMatch = p.match(fileRegex);
  if (fileMatch) return fileMatch[1];
  
  // Last resort: look for any URL with master.m3u8
  var masterRegex = /(https?:\/\/[^"\'\s]+\/master\.m3u8[^"\'\s]*)/i;
  var masterMatch = p.match(masterRegex);
  if (masterMatch) return masterMatch[1];
  
  return null;
}



/**
 * Decrypt playback data using Cloudflare Worker
 */
function decryptPlayback(encryptedData) {
  var response = http.request(DECRYPT_WORKER, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    postdata: JSON.stringify(encryptedData)
  });
  
  return JSON.parse(response.toString());
}

/**
 * Clean movie title by removing year and extra information
 */
function cleanMovieTitle(title) {
  if (typeof title !== "string") return title;
  
  title = title.replace(/\s*\(?\d{4}\)?\.?\s*$/g, "");
  title = title.replace(/\s*[-–—]\s*\d{4}\s*$/g, "");
  title = title.replace(/\s*(HD|FHD|UHD|4K|1080p|720p|480p|BluRay|WEB-DL|WEBRip|DVDRip|HDTV|CAMRip|PreDVDRip|HDRip)\s*$/gi, "");
  title = title.replace(/\s*\[.*?\]\s*$/g, "");
  title = title.replace(/\s*\([^)]*(?!.*\d{4})[^)]*\)\s*$/g, "");
  title = title.replace(/[._]+/g, " ");
  title = title.replace(/\s+/g, " ");
  title = title.trim();
  
  return title;
}

/**
 * Extract year from title
 */
function extractYear(title) {
  if (typeof title !== "string") return null;
  
  var yearMatch = title.match(/\((\d{4})\)/);
  if (yearMatch) return yearMatch[1];
  
  yearMatch = title.match(/[-–—]\s*(\d{4})\s*$/);
  if (yearMatch) return yearMatch[1];
  
  yearMatch = title.match(/\s(\d{4})\s*$/);
  if (yearMatch) return yearMatch[1];
  
  return null;
}

/**
 * Get IMDB information
 */
function getIMDB(title) {
  try {
    var year = extractYear(title);
    var cleanTitle = cleanMovieTitle(title);
    
    console.log("Original title: " + title);
    console.log("Cleaned title: " + cleanTitle);
    
    var url = "https://www.omdbapi.com/?t=" + encodeURIComponent(cleanTitle) + "&apikey=af04ad5c";
    
    if (year) {
      url += "&y=" + year;
    }
    
    var headerData = {
      caching: false,
      headers: {
        "User-Agent": UA,
      },
    };

    var resp = http.request(url, headerData).toString();
    var result = JSON.parse(resp);
    
    if (result.Response === "False" && year) {
      console.log("Retrying without year...");
      url = "https://www.omdbapi.com/?t=" + encodeURIComponent(cleanTitle) + "&apikey=af04ad5c";
      resp = http.request(url, headerData).toString();
      result = JSON.parse(resp);
    }
    
    if (result.Response === "False") {
      console.log("Trying search API...");
      url = "https://www.omdbapi.com/?s=" + encodeURIComponent(cleanTitle) + "&apikey=af04ad5c";
      if (year) {
        url += "&y=" + year;
      }
      resp = http.request(url, headerData).toString();
      var searchResult = JSON.parse(resp);
      
      if (searchResult.Response === "True" && searchResult.Search && searchResult.Search.length > 0) {
        var imdbID = searchResult.Search[0].imdbID;
        url = "https://www.omdbapi.com/?i=" + imdbID + "&apikey=af04ad5c";
        resp = http.request(url, headerData).toString();
        result = JSON.parse(resp);
      }
    }
    
    return result.Response === "True" ? result : {};
  } catch (error) {
    console.log("IMDB error: " + error.message);
    return {};
  }
}

/**
 * Decode HTML entities
 */
function decodeHtmlEntities(text) {
  if (typeof text !== "string") return text;

  return text
    .replace(/&#38;/g, "&")
    .replace(/&#39;/g, "'")
    .replace(/&#40;/g, "(")
    .replace(/&#41;/g, ")")
    .replace(/&amp;/g, "&")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"');
}

/**
 * Colored string helper
 */
function coloredStr(str, color) {
  return '<font color="' + color + '">' + str + "</font>";
}
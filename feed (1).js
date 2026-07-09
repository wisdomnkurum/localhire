function extractTag(xml, tag) {
  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i");
  const m = xml.match(regex);
  if (!m) return "";
  let val = m[1].trim();
  const cdata = val.match(/<!\[CDATA\[([\s\S]*?)\]\]>/);
  if (cdata) val = cdata[1];
  return val.trim();
}

function stripHtml(str) {
  return str.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
}

function parseItems(xml) {
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  const items = [];
  let match;
  while ((match = itemRegex.exec(xml)) !== null) {
    const itemXml = match[1];
    const rawTitle = extractTag(itemXml, "title");
    const link = extractTag(itemXml, "link");
    const description = stripHtml(extractTag(itemXml, "description"));
    const pubDate = extractTag(itemXml, "pubDate");

    // MyJobMag titles are often "Job Title at Company Name"
    let title = rawTitle;
    let company = "";
    const atSplit = rawTitle.match(/^(.*?)\s+at\s+(.+)$/i);
    if (atSplit) {
      title = atSplit[1].trim();
      company = atSplit[2].trim();
    }

    if (title && link) {
      items.push({ id: link, title, company, snippet: description.slice(0, 220), link, updated: pubDate });
    }
  }
  return items;
}

export default async function handler(req, res) {
  try {
    const feedRes = await fetch("https://www.myjobmag.com/aggregate_feed.xml");
    if (!feedRes.ok) {
      return res.status(feedRes.status).json({ error: "Failed to fetch feed" });
    }
    const xml = await feedRes.text();
    const jobs = parseItems(xml).slice(0, 40);
    return res.status(200).json({ jobs });
  } catch (e) {
    return res.status(500).json({ error: "Failed to fetch jobs feed" });
  }
}

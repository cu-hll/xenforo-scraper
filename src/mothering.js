/*
 * Mothering is a Xenforo forum that has a pretty straightforward structure for
 * scraping.
 *
 * A forum can have multiple (sub)fora and/or threads. The link to a forum is
 * given as an href in an anchor that includes the qid attribute of
 * "forum-item-title." Finding those will yield a list of fora, at least on the
 * particular page.
 *
 * Threads are exposed via the qid value "thread-item-title".
 *
 * Threads are made up of posts. These are rather rich DOM elements wrapped in
 * <article> tags from within a parent element with a qid of
 * "thread-box-parent"
 *
 * So the Mothering db should have three collections: fora, threads, and posts.
 *
 * A fora document will have the keys "href" and perhaps something like "name."
 * The same goes for threads. Posts will have a content key and perhaps a
 * threadId key. Given the rich metadata in the <article> for each post, a lot
 * of the structure can be rebuilt post facto.
 *
 * Finally, if there is a next page, it can be reached by finding the element with the qid of "page-nav-next-button"
 *
 * So given a url:
 *   * search for fora and biuld a list
 *     * drill into the forum and search for threads and build a list.
 *       * drill into the threads and build extract, page-by-page, the posts.
 *
 * At first, we can not follow the page nav, when testing.
 */

import got from "got";
import { JSDOM } from "jsdom";
// import client from "./mongo-client.js";

export default async function crawlMothering() {
  const startUrl = "http://mothering.com/forums";
  const response = await got(startUrl);
  const dom = new JSDOM(response.body);
  const { document } = dom.window;
  const fora = [...document.querySelectorAll('a[qid="forum-item-title"]')];
  fora.forEach(e => console.log(e.href));
}

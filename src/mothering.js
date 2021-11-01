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

import { gotScraping } from "got-scraping";
import got from "got";
import { JSDOM } from "jsdom";
import client from "./mongo-client.js";
import { stdout } from "process";

const host = "http://mothering.com";

export default async function crawlMothering() {
  try {
    await client.connect();
    const dbo = client.db("mothering");
    // First, capture all the fora.
    // Delete previous fora.
    // await dbo.dropCollection("fora");
    /* Fora and threads captured
    const startUrl = `${host}/forums/vaccinations.47`;
    const fora = await captureFora(startUrl, [], host);
    const results = await dbo.collection("fora").insertMany(fora);
    // Next, capture all the threads.
    const capturedFora = await dbo.collection("fora").find({}).toArray();
    // await dbo.dropCollection("threads");
    for (const forum of capturedFora) {
      await captureThreads(forum.href, dbo);
    }
    */

    // Special code to catch all the threads in the main Vaccination forum:
    // await captureThreads("/forums/vaccinations.47/", dbo);


    const capturedThreads = await dbo.collection("threads").find({}).toArray();
    stdout.write(`No. of threads: ${capturedThreads.length}\n`);
    const capturedPosts = await dbo.collection("posts").find({}).toArray();
    stdout.write(`No. of posts: ${capturedPosts.length}\n`);
    // Special code to correct when the system crashes
    // This is the "thread" property of the last post captured.
    // It makes up part of the "href" property among threads, so:
    const lastThread = capturedPosts[capturedPosts.length - 1].thread;
    stdout.write(`Last post thread: ${lastThread}.\n`);
    // thread: 'not-vaxxing-in-canada.1310560',
    const threads = capturedThreads.map(({ href }) => {
      const regex = /\/threads\/([^\/]*)\//;
      return regex.exec(href)[1];
    });

    const indexOfLastThread = threads.indexOf(lastThread);
    const threadsWithPostsToCapture = capturedThreads.slice(indexOfLastThread);
    for (const thread of threadsWithPostsToCapture) {
      await capturePosts(thread.href, dbo);
    }

  } finally {
    stdout.write("Closing the client.\n");
    await client.close();
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function capturePosts(threadHref, dbo) {
  await sleep(5000);
  const date = new Date;
  stdout.write(`[${date.toLocaleString('en-US')}]: ${threadHref} => `);
  try {
    let scraped = false;
    const response = await gotScraping.get(host + threadHref);
    const { window } = new JSDOM(response.body);
    const { document } = window;
    const posts = [...document.querySelectorAll('article[qid="post-item"]')].map(
      post => ({
        thread: threadHref.split("/")[2],
        text: post.outerHTML,
        postId: post.dataset.content,
        created: new Date(),
      })
    );

    if (posts.length > 0) {
      stdout.write(`scraped\n`);
      await dbo.collection("posts").insertMany(posts);
      scraped = true;
    }

    const nextButtons = [
      ...document.querySelectorAll('a[qid="page-nav-next-button"]'),
    ];
    if (nextButtons.length > 0) {
      stdout.write(`Next page: ${nextButtons[0].href}\n`);
      await capturePosts(nextButtons[0].href, dbo);
    }
  } catch (error) {
    stdout.write(`####### I caught the error!: ${error}\n`);
    await capturePosts(threadHref, dbo);
  }
}

async function captureThreads(forumHref, dbo) {
  await sleep(5000);
  const response = await gotScraping.get(host + forumHref);
  const { window } = new JSDOM(response.body);
  const { document } = window;
  const threads = [
    ...document.querySelectorAll('a[qid="thread-item-title"]'),
  ].map(thread => ({
    forum: forumHref.split("/")[2],
    name: thread.innerHTML,
    href: thread.href,
    created: new Date(),
  }));

  await dbo.collection("threads").insertMany(threads);

  const nextButtons = [
    ...document.querySelectorAll('a[qid="page-nav-next-button"]'),
  ];
  if (nextButtons.length > 0) {
    await sleep(5000);
    console.log("there is a new page: ", nextButtons[0].href);
    await captureThreads(nextButtons[0].href, dbo);
  }
}

async function captureFora(url, allFora) {
  const response = await got(url);
  const { window } = new JSDOM(response.body);
  const { document } = window;
  for (const forum of [
    ...document.querySelectorAll('a[qid="forum-item-title"]'),
  ]) {
    allFora.push({
      name: forum.innerHTML,
      href: forum.href,
      created: new Date(),
    });
    await captureFora(`${host}${forum.href}`, allFora);
  }

  return allFora;
}

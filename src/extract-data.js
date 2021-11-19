import client from "./mongo-client.js";
import { stdout } from "process";
import { mkdirSync, existsSync, writeFileSync, createWriteStream } from "fs";
import stringify from "csv-stringify/lib/sync";
import { parse } from "node-html-parser";

export default async function extractData() {
  const root = "./mothering-corpus/"
  try {
    await client.connect();
    const dbo = client.db("mothering");

    const posts = await dbo.collection("posts").find({}).toArray();
    // posts have:
    // thread
    // text
    // postId
    
    const columns = ["postId", "thread", "timestamp", "filePath"];
    const logger = setupLogger(columns, root);

    for(const post of posts) {
      const {postId, thread, text} = post;
      const { postDateTime, postText } = parseText(text);
      const postDate = new Date(postDateTime);
      const path = setDatePath(postDate, root)
      const filePath = `${path}/${postId}.html`

      logger.write(line([postId, thread, Date.parse(postDate), filePath.replace("./mothering-corpus/", "")]));

      writeFileSync(filePath, postText);
    }

  } finally {
    stdout.write("Closing the client.\n");
    await client.close();
  }
}

function parseText(text) {
  const article = parse(text);
  const postDateTime = article.querySelector("time[qid='post-date-time']").attributes.datetime;
  const postText = article.querySelector("article[qid='post-text']").toString();
  return {
    postDateTime,
    postText
  }
}

function setDatePath(date, root) {
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, "0");
  const path = `${root}/posts/${date.getFullYear()}/${month}/${day}`
  if(!existsSync(path)) {
    mkdirSync(path, { recursive: true })
  }

  return path;
}

function setupLogger(columns, path) {
  const logger = createWriteStream(path + "metadata.csv");
  logger.write(line(columns));
  return logger;
}

function line(data){
  return stringify([data]);
}

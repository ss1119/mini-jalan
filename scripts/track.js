const cp = require("child_process");
const fs = require("fs-extra");
const util = require("util");
const glob = util.promisify(require("glob"));

function exec(cmd, args, options) {
  return new Promise((resolve, reject) => {
    let stdout = "";
    let stderr = "";
    p = cp.spawn(cmd, args, options);
    p.stdout.on("data", (data) => stdout += data);
    p.stderr.on("data", (data) => stderr += data);
    p.on("close", (code) => {
      if (code === 0) {
        resolve(stdout);
      } else {
        reject(stderr);
      }
    })
  });
}

function execout(cmd, args, options) {
  return new Promise((resolve, reject) => {
    let stdout = "";
    let stderr = "";
    p = cp.spawn(cmd, args, options);
    p.stdout.on("data", (data) => {
      console.log("" + data);
      stdout += data;
    });
    p.stderr.on("data", (data) => {
      console.error("" + data);
      stderr += data;
    });
    p.on("close", (code) => {
      if (code === 0) {
        resolve(stdout);
      } else {
        reject(stderr);
      }
    })
  });
}

const targets = [
  "config",
  "src",
  "static",
  "public",
];

const ignores = [
  "package.json",  
];

(async function() {
  const command = process.argv[2];
  const args = process.argv.slice(3);
  switch(command) {
    case "clone": 
      await clone(args);
      await addAll();
      break;
    case "test":
    case "run":
      await test();  
  }
})().catch(e => console.error(e));

async function add(file) {
  await exec("track", ["add", file]);  
}

async function addAll(files) {
  await execout("track", [["add"], files].flat());
}

async function remove(matcher) {
  const files = await glob(matcher);
  await Promise.all(files.map(f => fs.remove(f)));
}

async function clone(args) {
  console.log("=== Downloading challenge ===");
  const stdout = await exec("track", [["clone"], args].flat());
  stdout.split("\n").forEach(l => console.log(`> ${l}`));
  const dirname = (/cd (.+_challenge_\d+) && track status/.exec(stdout) || [])[1];
  const dir = await fs.readdir(dirname);
  for (const f of dir) {
    if (ignores.indexOf(f) >= 0) continue;
    await fs.move(dirname + "/" + f, "./" + f, { overwrite: true });
  }
  fs.remove(dirname);
  console.log("=== Adding all files ===");
  await addAll(targets);
}

async function test() {
  console.log("=== Build applicaiton ===");  
  await execout("npm", ["run", "build"]);
  await remove("public/**/*.js.map");
  console.log("=== Adding all files ===");
  await addAll(targets);
  console.log("=== Run Tests ===");
  await execout("track", ["run"]);
}
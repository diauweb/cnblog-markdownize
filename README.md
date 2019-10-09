# cnblog-markdownize
A simple crawler to save normal/protected cnblog article to markdown and download all images.

## Usage
```sh
node index.js <blog_path> [password]
```
Use url containing `/protected/` if you want to save a protected blog.
To download a protected blog, you need to copy your cookies to `cookie.json`.

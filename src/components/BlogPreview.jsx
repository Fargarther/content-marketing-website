// Blog preview section with placeholder posts
const posts = [
  {
    title: 'Blog Post One',
    excerpt: 'A short teaser about this post...',
    link: '#'
  },
  {
    title: 'Blog Post Two',
    excerpt: 'Another teaser goes right here...',
    link: '#'
  },
  {
    title: 'Blog Post Three',
    excerpt: 'Yet another captivating teaser...',
    link: '#'
  }
];

const BlogPreview = () => (
  <section id="blog" className="blog">
    <h2>Blog</h2>
    <div className="blog-grid">
      {posts.map((post, idx) => (
        <div className="blog-card" key={idx}>
          <h3>{post.title}</h3>
          <p>{post.excerpt}</p>
          <a href={post.link} target="_blank" rel="noopener noreferrer">
            Read more
          </a>
        </div>
      ))}
    </div>
  </section>
);

export default BlogPreview;

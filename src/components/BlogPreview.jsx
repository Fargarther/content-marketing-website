// Blog preview section with recent posts
const posts = [
  {
    title: 'The Art of Authentic Brand Storytelling',
    date: 'January 15, 2025',
    excerpt: 'Discover how to craft compelling brand narratives that resonate with your audience and drive engagement...',
    link: '#'
  },
  {
    title: 'SEO Content Strategy for 2025',
    date: 'January 8, 2025',
    excerpt: 'Essential SEO tactics and content strategies to boost your organic visibility this year...',
    link: '#'
  },
  {
    title: 'Building Community Through Content',
    date: 'December 28, 2024',
    excerpt: 'Learn how to create content that fosters genuine community engagement and loyalty...',
    link: '#'
  }
];

const BlogPreview = () => (
  <section id="blog" className="blog">
    <h2>Latest Posts</h2>
    <div className="blog-grid">
      {posts.map((post, idx) => (
        <article className="blog-card" key={idx}>
          <div className="blog-date">{post.date}</div>
          <h3>{post.title}</h3>
          <p className="blog-excerpt">{post.excerpt}</p>
          <a href={post.link} target="_blank" rel="noopener noreferrer" className="portfolio-link">
            Read More →
          </a>
        </article>
      ))}
    </div>
  </section>
);

export default BlogPreview;
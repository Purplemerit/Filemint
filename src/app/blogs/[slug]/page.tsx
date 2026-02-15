'use client'
import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Navbar from '@/app/components/Navbar'
import Footer from '@/app/components/footer'
import Image from 'next/image'
import Link from 'next/link'
import { posts } from '../data'

export default function BlogPostPage() {
    const params = useParams()
    const router = useRouter()
    const slug = params?.slug as string

    const post = posts.find((p) => p.slug === slug)

    const [isMobile, setIsMobile] = useState(false)
    useEffect(() => {
        const checkWidth = () => setIsMobile(window.innerWidth <= 720)
        checkWidth()
        window.addEventListener("resize", checkWidth)
        return () => window.removeEventListener("resize", checkWidth)
    }, [])

    if (!post) {
        return (
            <>
                <Navbar />
                <div style={{ padding: '10rem 2rem', textAlign: 'center' }}>
                    <h1 style={{ fontFamily: "Georgia, serif", fontSize: '2rem' }}>Post Not Found</h1>
                    <Link href="/blogs" style={{ color: '#667eea', marginTop: '1rem', display: 'inline-block' }}>Back to Blogs</Link>
                </div>
                <Footer />
            </>
        )
    }

    return (
        <>
            <Navbar />

            <article style={{ background: '#fff' }}>
                {/* Header Section */}
                <header style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    padding: isMobile ? '4rem 1.5rem 6rem' : '6rem 2rem 8rem',
                    textAlign: 'center',
                    color: 'white'
                }}>
                    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                        <Link href="/blogs" style={{
                            color: 'rgba(255,255,255,0.8)',
                            textDecoration: 'none',
                            fontSize: '0.9rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem',
                            marginBottom: '2rem'
                        }}>
                            <span>←</span> Back to all blogs
                        </Link>
                        <h1 style={{
                            fontFamily: "Georgia, serif",
                            fontSize: isMobile ? '2rem' : '3.5rem',
                            fontWeight: '500',
                            lineHeight: 1.2,
                            marginBottom: '1.5rem'
                        }}>
                            {post.title}
                        </h1>
                        <p style={{
                            fontSize: isMobile ? '1.1rem' : '1.25rem',
                            opacity: 0.9,
                            maxWidth: '600px',
                            margin: '0 auto',
                            lineHeight: 1.5
                        }}>
                            {post.desc}
                        </p>
                    </div>
                </header>

                {/* Content Section */}
                <main style={{
                    maxWidth: '800px',
                    margin: '-4rem auto 6rem',
                    padding: isMobile ? '1.5rem' : '0 2rem',
                    position: 'relative',
                    zIndex: 10
                }}>
                    <div style={{
                        background: 'white',
                        borderRadius: '24px',
                        boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                        overflow: 'hidden'
                    }}>
                        {/* Featured Image */}
                        <div style={{ position: 'relative', width: '100%', height: isMobile ? '250px' : '450px' }}>
                            <Image
                                src={post.image}
                                alt={post.title}
                                fill
                                style={{ objectFit: 'cover' }}
                            />
                        </div>

                        {/* Blog Text */}
                        <div style={{
                            padding: isMobile ? '2rem 1.5rem' : '4rem',
                            fontFamily: "Georgia, serif",
                            fontSize: '1.15rem',
                            lineHeight: 1.8,
                            color: '#333'
                        }}>
                            <div
                                dangerouslySetInnerHTML={{ __html: post.content }}
                                className="blog-content"
                            />

                            <hr style={{ border: 'none', borderTop: '1px solid #eee', margin: '4rem 0 2rem' }} />

                            <div style={{ textAlign: 'center' }}>
                                <p style={{ color: '#666', fontSize: '1rem', marginBottom: '1.5rem' }}>Liked this article? Check out our tools below.</p>
                                <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
                                    <Link href="/" style={{
                                        padding: '0.6rem 1.5rem',
                                        borderRadius: '8px',
                                        background: '#667eea',
                                        color: 'white',
                                        textDecoration: 'none',
                                        fontWeight: '600'
                                    }}>Try FileMint Tools</Link>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Related Posts */}
                    <section style={{ marginTop: '6rem' }}>
                        <h2 style={{ fontFamily: "Georgia, serif", fontSize: '1.75rem', marginBottom: '2rem', textAlign: 'center' }}>Keep Reading</h2>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
                            gap: '2rem'
                        }}>
                            {posts.filter(p => p.slug !== slug).slice(0, 2).map((otherPost, idx) => (
                                <Link key={idx} href={`/blogs/${otherPost.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                                    <div style={{
                                        background: 'white',
                                        borderRadius: '16px',
                                        border: '1px solid #eee',
                                        overflow: 'hidden',
                                        transition: 'all 0.3s ease'
                                    }}>
                                        <div style={{ position: 'relative', height: '180px' }}>
                                            <Image src={otherPost.image} alt={otherPost.title} fill style={{ objectFit: 'cover' }} />
                                        </div>
                                        <div style={{ padding: '1.5rem' }}>
                                            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: '#111' }}>{otherPost.title}</h3>
                                            <p style={{ fontSize: '0.95rem', color: '#666' }}>{otherPost.desc}</p>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </section>
                </main>
            </article>

            <Footer />

            <style>{`
                .blog-content h3 {
                    margin: 2.5rem 0 1rem;
                font-size: 1.75rem;
                color: #111;
        }
                .blog-content p {
                    margin-bottom: 1.5rem;
        }
                .blog-content ol, .blog-content ul {
                    margin-bottom: 2rem;
                padding-left: 1.5rem;
        }
                .blog-content li {
                    margin-bottom: 0.75rem;
        }
      `}</style>
        </>
    )
}

import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const ADMIN_EMAILS = process.env.ADMIN_EMAILS 
  ? process.env.ADMIN_EMAILS.split(',').map(email => email.trim().toLowerCase())
  : ['admin@toolhub.com'];

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function POST(request) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json(
        { isAdmin: false, message: 'No token provided' },
        { status: 401 }
      );
    }

    // Verify and decode token
    const decoded = jwt.verify(token, JWT_SECRET);
    const userEmail = (decoded.email || decoded.user?.email || '').toLowerCase();

    // Check if email is in admin list
    const isAdmin = ADMIN_EMAILS.includes(userEmail);

    if (!isAdmin) {
      return NextResponse.json(
        { isAdmin: false, message: 'Not authorized' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { isAdmin: true, email: userEmail },
      { status: 200 }
    );

  } catch (error) {
    console.error('Admin check error:', error);
    return NextResponse.json(
      { isAdmin: false, message: 'Invalid token' },
      { status: 401 }
    );
  }
}
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type BookStatus = 'Available' | 'Borrowed' | 'Overdue';

export interface Book {
  id: string;
  title: string;
  author: string;
  isbn: string;
  category: string;
  status: BookStatus;
  price?: number;
  coverImage?: string;
  publisher?: string;
  publishedYear?: number;
  location?: string;
  borrowerId?: string;
  dueDate?: string;
}

export interface User {
  id: string;
  fullName: string;
  rollNumber: string;
  batch: string;
  email?: string;
  phone?: string;
  membershipStatus: 'Active' | 'Expired' | 'Suspended';
  expiryDate: string;
  profilePhoto?: string;
  outstandingFines: number;
}

export interface Transaction {
  id: string;
  bookId: string;
  userId: string;
  type: 'Issue' | 'Return';
  date: string;
  dueDate?: string;
  fineAmount?: number;
  status: 'Completed' | 'Pending';
}

export interface Fine {
  id: string;
  userId: string;
  bookId: string;
  amount: number;
  date: string;
  status: 'Paid' | 'Unpaid';
}

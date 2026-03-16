/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Book, User } from './types';

export const COLORS = {
  deepIndigo: '#1A237E',
  indigo: '#283593',
  mediumIndigo: '#3949AB',
  lightIndigo: '#5C6BC0',
  emerald: '#00897B',
  amber: '#FFA000',
  crimson: '#C62828',
  neutralGray: '#ECEFF1',
};

export const INITIAL_BOOKS: Book[] = [
  {
    id: '1',
    title: 'The Great Gatsby',
    author: 'F. Scott Fitzgerald',
    isbn: '9780743273565',
    category: 'Fiction',
    status: 'Available',
    price: 499,
    coverImage: 'https://picsum.photos/seed/gatsby/200/300',
    publisher: 'Scribner',
    publishedYear: 1925,
    location: 'Shelf A-1',
  },
  {
    id: '2',
    title: 'To Kill a Mockingbird',
    author: 'Harper Lee',
    isbn: '9780061120084',
    category: 'Classic',
    status: 'Borrowed',
    price: 350,
    coverImage: 'https://picsum.photos/seed/mockingbird/200/300',
    borrowerId: '101',
    dueDate: '2026-03-20',
    location: 'Shelf B-2',
  },
  {
    id: '3',
    title: '1984',
    author: 'George Orwell',
    isbn: '9780451524935',
    category: 'Dystopian',
    status: 'Overdue',
    price: 299,
    coverImage: 'https://picsum.photos/seed/1984/200/300',
    borrowerId: '102',
    dueDate: '2026-03-10',
    location: 'Shelf C-3',
  },
];

export const INITIAL_USERS: User[] = [
  {
    id: '101',
    fullName: 'John Doe',
    rollNumber: 'CS2023001',
    batch: '2023-2027',
    email: 'john@example.com',
    phone: '+91 9876543210',
    membershipStatus: 'Active',
    expiryDate: '2027-01-01',
    outstandingFines: 0,
    profilePhoto: 'https://i.pravatar.cc/150?u=101',
  },
  {
    id: '102',
    fullName: 'Jane Smith',
    rollNumber: 'CS2023002',
    batch: '2023-2027',
    email: 'jane@example.com',
    phone: '+91 9123456789',
    membershipStatus: 'Active',
    expiryDate: '2026-12-31',
    outstandingFines: 150,
    profilePhoto: 'https://i.pravatar.cc/150?u=102',
  },
];

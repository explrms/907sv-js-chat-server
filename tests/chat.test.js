const request = require('supertest');
const app = require('../server');
const { cleanTestDb } = require('../db');
const { generateRandomUser, generateRandomChat } = require('./test-utils');

let authCookie;
let authUser;
beforeAll(async () => {
  const user = generateRandomUser();
  const res = await request(app)
    .post('/user')
    .send(user);
  authUser = res.body;
  const res2 = await request(app)
    .post('/auth')
    .send(user);
  authCookie = res2.headers['set-cookie'][0];
});

afterAll(() => {
  cleanTestDb();
});

describe('Chat', () => {
  it('should create chat with title', async () => {
    const chat = generateRandomChat();
    chat.userId = authUser.id;
    const res = await request(app)
      .post('/chat')
      .set('Cookie', [authCookie])
      .send(chat);
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('title');
    expect(res.body.title).toEqual(chat.title);
  });

  it('should not create chat with empty title', async () => {
    const chat = generateRandomChat();
    chat.userId = authUser.id;
    chat.title = '';
    const res = await request(app)
      .post('/chat')
      .set('Cookie', [authCookie])
      .send(chat);
    expect(res.statusCode).toEqual(400);
  });

  it('should be accessible by id', async () => {
    const chat = generateRandomChat();
    chat.userId = authUser.id;
    const res = await request(app)
      .post('/chat')
      .set('Cookie', [authCookie])
      .send(chat);

    const res2 = await request(app)
      .get(`/chat/${res.body.id}`)
      .set('Cookie', [authCookie]);

    expect(res2.statusCode).toEqual(200);
    expect(res2.body).toHaveProperty('title');
    expect(res2.body.title).toEqual(chat.title);
    expect(res2.body.userId).toEqual(authUser.id);
  });

  it('should be accessible by author id', async () => {
    const res = await request(app)
      .get(`/chat/?userId=${authUser.id}`)
      .set('Cookie', [authCookie]);

    expect(res.statusCode).toEqual(200);
    expect(res.body.length).toEqual(2);
    expect(res.body[0]).toHaveProperty('title');
  });

  it('should be accessible by participant id', async () => {
    const res = await request(app)
      .get(`/chat/?participantId=${authUser.id}`)
      .set('Cookie', [authCookie]);

    expect(res.statusCode).toEqual(200);
    expect(res.body.length).toEqual(2);
    expect(res.body[0]).toHaveProperty('title');
  });

  it('should search by chat title', async () => {
    const chat = generateRandomChat();
    chat.userId = authUser.id;
    chat.title = 'test';
    const res = await request(app)
      .post('/chat')
      .set('Cookie', [authCookie])
      .send(chat);

    const res2 = await request(app)
      .get(`/chat/?title=${chat.title.toUpperCase()}`)
      .set('Cookie', [authCookie]);
    expect(res2.statusCode).toEqual(200);
    expect(res2.body.length).toEqual(1);
    expect(res2.body[0]).toHaveProperty('title');
    expect(res2.body[0].title).toEqual(chat.title);
  });
});

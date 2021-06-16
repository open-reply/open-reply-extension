// Exports:
export const PLANS = {
  FREE: 'FREE',
  PREMIUM: 'PREMIUM',
  GOLD: 'GOLD'
};

export const QUOTA = {
  [ PLANS.FREE ]: {
    URLs: 10,
    comments: 20,
    replies: 20
  },
  [ PLANS.PREMIUM ]: {
    URLs: 25,
    comments: 50,
    replies: 50,
  },
  [ PLANS.GOLD ]: {
    URLs: 50,
    comments: 100,
    replies: 100,
  }
};

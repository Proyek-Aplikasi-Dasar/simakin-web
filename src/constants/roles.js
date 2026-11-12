export const ROLE_MAP = {
  1: 'admin',
  2: 'guru',
  3: 'siswa',
}

export const ROLE_ID_BY_NAME = Object.fromEntries(
  Object.entries(ROLE_MAP).map(([id, nama]) => [nama, Number(id)])
)
export const WEB_ROLES = ['admin', 'guru']

export const HOME_BY_ROLE = {
  admin: '/admin',
  guru: '/guru',
}
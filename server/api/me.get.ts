export default defineEventHandler((event) => {
  const user = requireUser(event)
  return {
    id: user.id,
    authentikUid: user.authentikUid,
    email: user.email,
    displayName: user.displayName,
    isAdmin: user.isAdmin,
    groups: user.groups,
  }
})

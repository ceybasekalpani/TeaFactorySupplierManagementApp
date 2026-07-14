export function mapUser(u) {
  if (!u) return null;
  const img = u.profileImage || u.ProfileImage || u.image || null;
  return {
    id:            String(u.regNo ?? u.id ?? ""),
    name:          u.name          ?? u.regName ?? "",
    username:      u.username      ?? "",
    image:         img ? img.split("?")[0] : null,
    address:       u.address       ?? u.Address ?? "",
    phone:         u.phone         ?? u.Phone   ?? u.telNo ?? "",
    phone2:        u.phone2        ?? u.Phone2  ?? "",
    phone3:        u.phone3        ?? u.Phone3  ?? "",
    bankName:      u.bankName      ?? u.BankName      ?? "",
    accountNumber: u.accountNumber ?? u.AccountNumber ?? "",
    accountHolder: u.accountHolder ?? u.AccountHolder ?? "",
    branch:        u.branch        ?? u.Branch        ?? "",
  };
}

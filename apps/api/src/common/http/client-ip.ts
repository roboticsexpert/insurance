import type { Request } from 'express'

/**
 * The caller's real IP, as far as it can be trusted.
 *
 * In production traffic arrives Cloudflare → Railway → here, so `req.ip` is a proxy address and
 * would put every user in the same rate-limit bucket. `CF-Connecting-IP` is *overwritten* by
 * Cloudflare on every request, which is what makes it trustworthy — but only while the origin
 * is reachable exclusively through Cloudflare. If the Railway host is ever exposed directly,
 * this header becomes attacker-controlled and the per-IP limits become bypassable.
 */
export function getClientIp(req: Request): string {
  const cf = req.headers['cf-connecting-ip']
  if (typeof cf === 'string' && cf.length > 0) return cf

  const forwarded = req.headers['x-forwarded-for']
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    const first = forwarded.split(',')[0]?.trim()
    if (first) return first
  }

  return req.ip ?? 'unknown'
}

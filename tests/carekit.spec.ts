import { expect, test } from '@playwright/test'

test('supports the core caregiver workflow', async ({ page }) => {
  const errors: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error') {
      errors.push(message.text())
    }
  })
  page.on('pageerror', (error) => errors.push(error.message))

  await page.goto('/')
  await expect(page.getByRole('heading', { name: /Care dashboard/ })).toBeVisible()

  await page.getByRole('button', { name: 'Routines' }).click()
  await page.getByLabel('Title').fill('Evening music')
  await page.getByLabel('Time').fill('18:30')
  await page.getByLabel('Category').fill('Comfort')
  await page
    .getByLabel('Notes')
    .fill('Play the jazz playlist quietly after dinner.')
  await page.getByRole('button', { name: 'Add routine' }).click()
  await expect(page.getByText('Evening music')).toBeVisible()

  await page.getByRole('button', { name: 'Care log' }).click()
  await page.getByLabel('Notes').fill('Calm afternoon after the garden walk.')
  await page.getByRole('button', { name: 'Add note' }).click()
  await expect(
    page.getByText('Calm afternoon after the garden walk.'),
  ).toBeVisible()
  expect(errors).toEqual([])
})

import { test, expect } from "@playwright/test";
import MailosaurClient from "mailosaur";

const apiKey = process.env.MAILOSAUR_API_KEY;
const serverId = process.env.MAILOSAUR_SERVER_ID;

if (!apiKey || !serverId) {
  throw new Error('Mailosaur API key or server ID not found in environment variables.');
}

const mailosaur = new MailosaurClient(apiKey);
const testEmailAddress = `bhaumik@${serverId}.mailosaur.net`;


test.beforeEach(async ({ page }) => {
  await mailosaur.messages.deleteAll(serverId);
  await page.goto(
    "https://fenixshare.anchormydata.com/fenixpyre/s/669ff2910e5caf9f73cd28ea/QA%2520Assignment"
  );
  await page.getByPlaceholder("Email").fill(testEmailAddress);
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByLabel("Continue").click();

  const email = await mailosaur.messages.get(serverId, {
    sentTo: testEmailAddress,
  });

  await page
    .getByPlaceholder("Enter the One Time Passcode")
    .fill(extractOTPFromText(email.subject));
  await page.getByLabel("Continue").click();
  await page.waitForURL(
    "https://fenixshare.anchormydata.com/fenixpyre/s/669ff2910e5caf9f73cd28ea/QA%20Assignment"
  ,{waitUntil:'networkidle'});
});

test("Verify User Login", async ({ page, context }) => {
  await page.getByRole("button", { name: "Fenixpyre" }).click();
  await expect(page.getByRole("button", { name: "Logout" })).toBeVisible();
});

test("Verify File open in Edit mode", async ({ page, context }) => {
  await page
    .getByRole("row", { name: "Book.xlsx 21.24 KB Jul 24," })
    .getByTestId("ellipsis-icon")
    .click();
  await page.getByText("Open in new tab").click();
  const pagePromise = context.waitForEvent("page");
  const newPage = await pagePromise;
  await expect(
    newPage
      .frameLocator('iframe[name="office_frame"]')
      .getByLabel("Mode Menu;Editing Selected")
  ).toBeVisible({ timeout: 40000 });
  expect(await newPage.title()).toEqual("Book.xlsx");
});

test("Verify Search", async ({ page }) => {
  await page
    .getByLabel('Home')
    .click({force:true});
  await page.getByPlaceholder('Start typing to search...').fill('Book.xlsx')
  await expect(page.getByRole('cell', { name: 'Book.xlsx' })).toBeVisible()
  await page.getByPlaceholder('Start typing to search...').fill('1')
  await expect(page.getByRole('cell', { name: 'No results.' })).toBeVisible()
});


function extractOTPFromText(text: any): any {
  const otpRegex = /\b(\d{6})\b/;
  const match = text.match(otpRegex);
  if (match) {
    return match[1]; // Return the captured OTP
  } else {
    throw new Error("OTP not found in text");
  }
}

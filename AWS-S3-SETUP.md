# AWS S3 Setup Guide for File Sharing

This guide will help you set up AWS S3 for the file sharing feature in Filemint.

## Prerequisites

- AWS Account
- AWS CLI installed (optional but recommended)
- Access to AWS Console

## Step 1: Create an S3 Bucket

1. Go to [AWS S3 Console](https://s3.console.aws.amazon.com/)
2. Click **"Create bucket"**
3. Configure bucket settings:
   - **Bucket name**: Choose a unique name (e.g., `filemint-shared-files`)
   - **AWS Region**: Choose your preferred region (e.g., `us-east-1`)
   - **Block Public Access settings**: 
     - ⚠️ **UNCHECK** "Block all public access"
     - Check the acknowledgment box
   - Leave other settings as default
4. Click **"Create bucket"**

## Step 2: Configure Bucket CORS

1. Go to your bucket in S3 Console
2. Click on the **"Permissions"** tab
3. Scroll down to **"Cross-origin resource sharing (CORS)"**
4. Click **"Edit"** and paste the following configuration:

```json
[
    {
        "AllowedHeaders": [
            "*"
        ],
        "AllowedMethods": [
            "GET",
            "PUT",
            "POST",
            "DELETE",
            "HEAD"
        ],
        "AllowedOrigins": [
            "http://localhost:3000",
            "https://yourdomain.com"
        ],
        "ExposeHeaders": [
            "ETag"
        ],
        "MaxAgeSeconds": 3000
    }
]
```

5. Replace `https://yourdomain.com` with your actual domain
6. Click **"Save changes"**

## Step 3: Create IAM User for S3 Access

1. Go to [AWS IAM Console](https://console.aws.amazon.com/iam/)
2. Click **"Users"** in the left sidebar
3. Click **"Create user"**
4. Enter username: `filemint-s3-user`
5. Click **"Next"**
6. Select **"Attach policies directly"**
7. Search for and select: **"AmazonS3FullAccess"** (or create a custom policy with limited permissions)
8. Click **"Next"** and then **"Create user"**

## Step 4: Create Access Keys

1. Click on the newly created user (`filemint-s3-user`)
2. Go to **"Security credentials"** tab
3. Scroll down to **"Access keys"**
4. Click **"Create access key"**
5. Select **"Application running on an AWS compute service"** or **"Other"**
6. Click **"Next"** and then **"Create access key"**
7. **IMPORTANT**: Copy both:
   - Access key ID
   - Secret access key
   - ⚠️ You won't be able to see the secret key again!

## Step 5: Update Environment Variables

Add the following to your `.env` file (for local development) and `.env.production` (for production):

```env
# AWS S3 Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key_id_here
AWS_SECRET_ACCESS_KEY=your_secret_access_key_here
AWS_S3_BUCKET_NAME=filemint-shared-files
```

Replace:
- `us-east-1` with your bucket's region
- `your_access_key_id_here` with your Access Key ID
- `your_secret_access_key_here` with your Secret Access Key
- `filemint-shared-files` with your bucket name

## Step 6: Configure Bucket Policy (Optional - for public read access)

If you want files to be directly accessible via S3 URLs:

1. Go to your bucket's **"Permissions"** tab
2. Scroll to **"Bucket policy"**
3. Click **"Edit"** and paste:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::filemint-shared-files/shared-files/*"
        }
    ]
}
```

4. Replace `filemint-shared-files` with your bucket name
5. Click **"Save changes"**

## Step 7: Test the Configuration

1. Restart your application
2. Try using the share feature on any tool
3. Check if the file uploads successfully
4. Verify the share link works

## Security Best Practices

1. **Use IAM Roles on EC2**: Instead of access keys, use IAM roles when running on EC2
2. **Limit Permissions**: Create a custom IAM policy with only required permissions:
   ```json
   {
       "Version": "2012-10-17",
       "Statement": [
           {
               "Effect": "Allow",
               "Action": [
                   "s3:PutObject",
                   "s3:GetObject",
                   "s3:DeleteObject"
               ],
               "Resource": "arn:aws:s3:::filemint-shared-files/shared-files/*"
           }
       ]
   }
   ```
3. **Enable Bucket Versioning**: Helps recover from accidental deletions
4. **Set up Lifecycle Rules**: Automatically delete old files to save costs
5. **Enable Server-Side Encryption**: Protect data at rest

## Setting up Lifecycle Rules (Recommended)

To automatically delete expired files:

1. Go to your bucket's **"Management"** tab
2. Click **"Create lifecycle rule"**
3. Configure:
   - **Rule name**: `delete-expired-files`
   - **Rule scope**: Limit to prefix `shared-files/`
   - **Lifecycle rule actions**: Check "Expire current versions of objects"
   - **Days after object creation**: `1` (files expire after 24 hours)
4. Click **"Create rule"**

## Troubleshooting

### Files not uploading
- Check AWS credentials are correct
- Verify IAM user has S3 permissions
- Check bucket name is correct

### Share links not working
- Verify bucket CORS configuration
- Check bucket policy allows public read
- Ensure files are being uploaded to `shared-files/` prefix

### Access Denied errors
- Verify IAM permissions
- Check bucket policy
- Ensure region matches

## Cost Considerations

- S3 charges for storage and data transfer
- Typical costs for file sharing:
  - Storage: ~$0.023 per GB/month
  - PUT requests: ~$0.005 per 1,000 requests
  - GET requests: ~$0.0004 per 1,000 requests
- Use lifecycle rules to minimize costs

## Alternative: Using IAM Roles on EC2

If running on EC2, it's more secure to use IAM roles:

1. Create an IAM role with S3 permissions
2. Attach the role to your EC2 instance
3. Remove `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` from `.env`
4. The AWS SDK will automatically use the instance role

---

**Setup complete!** Your file sharing feature should now work with AWS S3. 🎉

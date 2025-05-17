import OSS from 'ali-oss';

// import { encrypt, decrypt } from '$lib/auth/credential';

// Initialize Alibaba Cloud OSS client
const client = new OSS({
	accessKeyId: process.env.NEXT_PUBLIC_OSS_KEY_ID,
	accessKeySecret: process.env.NEXT_PUBLIC_OSS_KEY_SECRET,
	region: process.env.NEXT_PUBLIC_OSS_REGION,
	bucket: process.env.NEXT_PUBLIC_OSS_BUCKET,
    endpoint: process.env.NEXT_PUBLIC_OSS_ENDPOINT,
    secure: true 
});

console.log(client)


/**
 * // Function to store a file in Alibaba Cloud OSS with metadata
 * @param {Path} filePath - Destination path in OSS
 * @param {Stream} fileStream  - Readable stream of the file
 * @param {Object} metadata - Metadata for the file
 * @returns
 */
export const storeFile = async (filePath, fileName, fileStream) => {
	try {
		// Read the stream into a Buffer
		const chunks = [];
		for await (const chunk of fileStream) {
			chunks.push(chunk);
		}
		const fileContent = Buffer.concat(chunks);

        console.log(client)
		// Upload the file to OSS
		const result = await client.put(filePath, fileContent, {
			meta: {
				file: fileName,
				userName: process.env.NEXT_PUBLIC_USER_NAME
			} // Set metadata for the file
		});
        console.log(result)

		return { status: 'success', result: result };
	} catch (err) {
		console.error('Error storing file in OSS:', err);
		return { status: 'failed', result: err }; // Propagate the error to the caller
	}
};

export const retrieveFile = async (filePath) => {
	try {
		// Retrieve metadata associated with the file using the head method
		const metadata = await client.head(filePath);

		if (metadata.meta.role !== 'superadmin') {
			console.error('User not authorized to retrieve this file');
			return { status: 'failed', result: 'User not authorized to retrieve this file' };
		}

		// Retrieve the file from OSS
		const result = await client.get(filePath);

		return { status: 'success', result: result };
	} catch (err) {
		console.error(
			'Error retrieving file from OSS:',
			err.code,
			err.params.object,
			err.params.bucket
		);
		return { status: 'failed', result: err }; // Propagate the error to the caller
	}
};

export const retrieveFileURL = async (filePath, userID, newFileName) => {
	try {
		// Retrieve metadata associated with the file using the head method
		const metadata = await client.head(filePath);

		if (!userID) {
			console.error('User not authorized to retrieve this file');
			return { status: 'failed', result: 'User not authorized to retrieve this file' };
		}

		let response;
		if (newFileName) {
			response = {
				'content-disposition': `attachment; filename="${newFileName}"`
			};
		}

		let url = client.signatureUrl(filePath, { expires: 3600, response: response }); // URL expires in 1 hour (adjust as needed)

		let secureUrl = url.replace('http://', 'https://');

		return { status: 'success', result: secureUrl };
	} catch (err) {
		console.error(
			'Error retrieving file from OSS:',
			err.code,
			err.params.object,
			err.params.bucket
		);
		return { status: 'failed', result: err }; // Propagate the error to the caller
	}
};

export const deleteFile = async (filePath) => {
	try {
		const result = await client.delete(filePath);

		return { status: 'success', result };
	} catch (err) {
		console.error('Error deleting file from OSS:', err.code, err.params.object, err.params.bucket);
		return { status: 'failed', result: err }; // Propagate the error to the caller
	}
};
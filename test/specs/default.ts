import { testSuite } from 'manten';

import { setupFixture } from '../fixture.js';

export default testSuite(async ({ test }, { tsVersion }: SuiteParameters) => {
	const fixture = await setupFixture({ tsVersion });
});

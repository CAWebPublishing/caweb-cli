# caweb-cli  
The `caweb-cli` is built using [@wordpress/env:5.2.0](https://www.npmjs.com/package/@wordpress/env/v/5.2.0) and lets you easily set up a local CAWeb Publishing WordPress environment for developing, testing and building. The `caweb-cli` will automatically generate a [.wp-env.json](https://www.npmjs.com/package/@wordpress/env/v/5.2.0#user-content-wp-envjson) file, additional customizations can be added by adding/editing a [.wp-env.override.json](https://www.npmjs.com/package/@wordpress/env/v/5.2.0#user-content-wp-envoverridejson) file.

## Prerequisites
1. `caweb-cli` requires Docker to be installed. There are instructions available for installing Docker on [Windows](https://docs.docker.com/desktop/install/windows-install/), [macOS](https://docs.docker.com/docker-for-mac/install/), and [Linux](https://docs.docker.com/desktop/install/linux-install/).
2. [ElegantThemes](https://www.elegantthemes.com/) Acccount Information. `ET_USERNAME` and `ET_API_KEY` should be added to the config section of the [.wp-env.override.json](https://www.npmjs.com/package/@wordpress/env/v/5.2.0#user-content-wp-envoverridejson) file.

## Quick (tl;dr) instructions
```
cd /path/to/project
npm -g i caweb-cli
caweb start
```
The local environment will be available at http://localhost:8888 (Username: `admin`, Password: `password`).  

## Additional Services
- **phpmyadmin** - MySQL administration for development instance, available at http://localhost:9000 (Username: `root`, Password: `password`).
- **tests-phpmyadmin** - MySQL administration for tests instance, available at http://localhost:9090 (Username: `root`, Password: `password`).

### More Information
- [@wordpress/env:5.2.0](https://www.npmjs.com/package/@wordpress/env/v/5.2.0)
- [CAWeb Publishing Service](https://caweb.cdt.ca.gov/)
- [CAWeb Theme](https://ca-code-works.github.io/CAWeb/)
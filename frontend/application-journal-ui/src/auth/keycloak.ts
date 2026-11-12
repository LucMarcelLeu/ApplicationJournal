import Keycloak from 'keycloak-js';

const keycloak = new Keycloak({
    url: 'https://auth.marcelleu.ch',
    realm: 'applicationjournal',
    clientId: 'applicationjournal-frontend',
});

export default keycloak;
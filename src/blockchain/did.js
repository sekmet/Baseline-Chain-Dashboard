import * as shell from 'shelljs';
 
export const execShellTest = async () => {

    const result = shell.exec('git --version');
    // Run external tool synchronously
    if (result.code !== 0) {
        shell.echo('Error: Git commit failed');
        shell.exit(1);
    }

    return result;
}

export const didIdentityManagerCreateIdentity = async (domain) => {

    const result = await shell.cd('did').exec(`yarn daf execute -m identityManagerCreateIdentity -a '{"domain":"${domain}"}'`);
    // Run external tool synchronously
    if (result.code !== 0) {
        shell.echo('Error: DAF identityManagerCreateIdentity failed');
        //shell.exit(1);
        return 'Error: DAF identityManagerCreateIdentity failed';
    }

    shell.cd('..');

    return result.split('Result (Identity interface):')[1].split('Done')[0];
}

export const didGenerateDidConfiguration = async (did, domain) => {

    const result = await shell.cd('did').exec(`yarn daf execute -m generateDidConfiguration -a '{"dids":["${did}"],"domain":"${domain}"}'`);
    // Run external tool synchronously
    if (result.code !== 0) {
        shell.echo('Error: DAF generateDidConfiguration failed');
        //shell.exit(1);
        return 'Error: DAF generateDidConfiguration failed';
    }

    shell.cd('..');
    return result.split('):')[1].split('Done')[0];
    //return result;
}

export const didVerifyWellKnownDidConfiguration = async (domain) => {

    const result = await shell.cd('did').exec(`yarn daf execute -m verifyWellKnownDidConfiguration -a '{"domain":"${domain}"}'`);
    // Run external tool synchronously
    if (result.code !== 0) {
        shell.echo('Error: DAF verifyWellKnownDidConfiguration failed');
        //shell.exit(1);
        return 'Error: DAF verifyWellKnownDidConfiguration failed';
    }

    if (result.split('):')[1] === undefined){
        shell.echo('Error: DAF verifyWellKnownDidConfiguration - Failed to download the .well-known DID');
        //shell.exit(1);
        return 'Error: DAF verifyWellKnownDidConfiguration - Failed to download the .well-known DID';
    }

    shell.cd('..');
    return result.split('):')[1].split('Done')[0];
    //return result;
}
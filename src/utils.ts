import { execSync, ExecSyncOptions } from 'child_process';
import * as spawn from 'cross-spawn';
import * as fs from 'fs';
import * as fsx from 'fs-extra';
import * as path from 'path';

import { CustomizedInfo } from './types';

export const checkFolderExist = (targetPath: string): boolean =>
  fsx.pathExistsSync(targetPath);

export const syncFolder = (sourcePath: string, targetPath: string): void =>
  fsx.copySync(sourcePath, targetPath);

export const currentPath: string = fs.realpathSync(process.cwd());

export const resolvePath = (...relativePath: string[]): string => {
  return path.resolve(currentPath, ...relativePath);
};

export const checkYarnExist = (): void => {
  try {
    execSync('yarnpkg --version', { stdio: 'ignore' });
    return;
  } catch {
    throw new Error('Yarn not exist');
  }
};

export const checkYarnUseDefaultRegistry = (): boolean =>
  execSync('yarnpkg config get registry')
    .toString()
    .trim() === 'https://registry.yarnpkg.com';

export const installPackagesByYarn = (targetPath: string): Promise<void> => {
  const command = 'yarnpkg';
  const args = ['install', '--exact', '--cwd', targetPath];

  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: 'inherit' });
    child.on('close', (code: number) => {
      if (code !== 0) reject(new Error('Failed to install packages by Yarn.'));
      resolve();
    });
  });
};

export const checkIsGitRepo = (targetPath: string): boolean => {
  try {
    execSync('git rev-parse --is-inside-work-tree', {
      cwd: targetPath,
      stdio: 'ignore'
    });
    return true;
  } catch {
    return false;
  }
};

export const createGitRepo = (targetPath: string): void => {
  let didInit = false;
  const config = {
    cwd: targetPath,
    stdio: 'ignore'
  } as ExecSyncOptions;

  try {
    execSync('git --version', config);

    execSync('git init', config);
    didInit = true;

    execSync('git add -A', config);
    execSync('git commit -m "init: project with create-pardjs-web"', config);
  } catch {
    if (didInit) {
      try {
        fsx.removeSync(path.join(targetPath, '.git'));
      } catch {
        // Ignore.
      }
    }
  }
};

export const updatePackageInfo = (
  targetPath: string,
  updateInfo: CustomizedInfo
): void => {
  try {
    const packFilePath = path.join(targetPath, 'package.json');
    const packageInfo = JSON.parse(
      fsx.readFileSync(packFilePath, { encoding: 'utf8' })
    );

    fsx.writeFileSync(
      packFilePath,
      JSON.stringify({ ...packageInfo, ...updateInfo }, null, 2),
      { encoding: 'utf8' }
    );
  } catch (error) {
    throw error;
  }
};

export const buildReadmeInfo = (
  targetPath: string,
  updateInfo: CustomizedInfo
): void => {
  try {
    const readmePath = path.join(targetPath, 'README.md');

    fsx.writeFileSync(
      readmePath,
      `
# ${updateInfo.name}

[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)
[![Build Status](https://travis-ci.com/pardjs/@pardjs/${
        updateInfo.name
      }.svg?branch=master)](https://travis-ci.com/pardjs/@pardjs/${
        updateInfo.name
      })
[![Coverage Status](https://coveralls.io/repos/github/pardjs/@pardjs/${
        updateInfo.name
      }/badge.svg?branch=master)](https://coveralls.io/github/pardjs/@pardjs/${
        updateInfo.name
      })

${updateInfo.description}

---

__Start README.md docs from here__

---

### Maintain

* submit a commit : \`yarn commit\`
* start test in watch : \`yarn test:watch\`
* build doc(GH pages) : \`yarn build:doc\`
* release project : \`yarn release\`
      `,
      { encoding: 'utf8' }
    );
  } catch (error) {
    throw error;
  }
};

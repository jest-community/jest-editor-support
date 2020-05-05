/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import ProjectWorkspace from '../project_workspace';

describe('setup', () => {
  it('sets itself up fom the constructor', () => {
    const workspace = new ProjectWorkspace('root_path', 'jest_command_line', 1000, 'path_to_config');
    expect(workspace.rootPath).toEqual('root_path');
    expect(workspace.jestCommandLine).toEqual('jest_command_line');
  });
  it('can safe guard outputFileSuffix', () => {
    const suffixStrings = [
      [undefined, undefined],
      ['with_underscore', 'with_underscore'],
      ['camelCase', 'camelcase'],
      ['upperCase', 'uppercase'],
      ['with Space', 'with_space'],
      ['WITH?special ? character\n', 'with_special___character_'],
    ];
    suffixStrings.forEach(pair => {
      const workspace = new ProjectWorkspace('root_path', 'jest_command_line', 1000, 'path_to_config', pair[0]);
      expect(workspace.outputFileSuffix).toEqual(pair[1]);
    });
  });
});

import React, { type JSX } from 'react';

import { IconButton, TextField } from '@mui/material';

import { IconCopy, Utils } from '@iobroker/adapter-react-v5';
import type { ConfigItemPattern } from '#JC/types';
import ConfigGeneric, { type ConfigGenericProps, type ConfigGenericState } from './ConfigGeneric';

interface ConfigPatternProps extends ConfigGenericProps {
    schema: ConfigItemPattern;
}

class ConfigPattern extends ConfigGeneric<ConfigPatternProps, ConfigGenericState> {
    renderItem(_error: unknown, disabled: boolean): JSX.Element | null {
        return (
            <TextField
                variant="standard"
                fullWidth
                disabled={!!disabled}
                slotProps={{
                    input: {
                        endAdornment: this.props.schema.copyToClipboard ? (
                            <IconButton
                                size="small"
                                onClick={() => {
                                    Utils.copyToClipboard(this.getPattern(this.props.schema.pattern));
                                    window.alert('Copied');
                                }}
                            >
                                <IconCopy />
                            </IconButton>
                        ) : undefined,
                    },
                }}
                value={this.getPattern(this.props.schema.pattern)}
                label={this.getText(this.props.schema.label)}
                helperText={this.renderHelp(
                    this.props.schema.help,
                    this.props.schema.helpLink,
                    this.props.schema.noTranslation,
                )}
            />
        );
    }
}

export default ConfigPattern;

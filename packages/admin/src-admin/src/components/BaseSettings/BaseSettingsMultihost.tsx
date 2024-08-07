import React, { createRef, Component } from 'react';

import {
    Grid,
    FormControlLabel,
    Checkbox,
    TextField,
    Paper,
} from '@mui/material';

import { type AdminConnection, withWidth, type Translate } from '@iobroker/adapter-react-v5';

const styles: Record<string, React.CSSProperties> = {
    paper: {
        height: '100%',
        maxHeight: '100%',
        maxWidth: '100%',
        overflow: 'auto',
        padding: 8,
    },
    controlItem: {
        width: 'calc(100% - 16px)',
        marginBottom: 16,
        marginRight: 8,
        marginLeft: 8,
    },
    RAM: {
        width: 400,
        marginRight: 8,
    },
};

export interface MultihostSettings {
    enabled?: boolean;
    secure?: boolean;
    password?: string;
}

interface BaseSettingsMultihostProps {
    t: Translate;
    onChange: (settings: MultihostSettings) => void;
    settings: MultihostSettings;
    socket: AdminConnection;
}

interface BaseSettingsMultihostState {
    enabled: boolean;
    secure: boolean;
    password?: string;
}

class BaseSettingsMultihost extends Component<BaseSettingsMultihostProps, BaseSettingsMultihostState> {
    private focusRef: React.RefObject<HTMLInputElement>;

    constructor(props: BaseSettingsMultihostProps) {
        super(props);

        const settings: MultihostSettings = this.props.settings || {};

        this.state = {
            enabled: settings.enabled || false,
            secure: settings.secure || true,
            password: '',
        };

        if (settings.password) {
            this.props.socket.decrypt(settings.password)
                .then((plainPass: string) =>
                    this.setState({ password: plainPass }));
        }

        this.focusRef = createRef();
    }

    componentDidMount() {
        this.focusRef.current?.focus();
    }

    onChange() {
        const newState: BaseSettingsMultihostState = {
            enabled: this.state.enabled,
            secure:  this.state.secure,
        };

        if (this.state.password) {
            this.props.socket.encrypt(this.state.password)
                .then((encodedPass: string) => {
                    newState.password = encodedPass;
                    this.props.onChange(newState);
                });
        } else {
            this.props.onChange(newState);
        }
    }

    render() {
        return <Paper style={styles.paper}>
            <form style={styles.form} noValidate autoComplete="off">
                <Grid item style={styles.gridSettings}>
                    <Grid container direction="column">
                        <Grid item style={styles.controlItem}>
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={this.state.enabled}
                                        onChange={e => this.setState({ enabled: e.target.checked }, () => this.onChange())}
                                    />
                                }
                                label={this.props.t('Allow slave connections')}
                            />
                            <div>{ this.props.t('When activated this host can be discovered by other iobroker installations in your network to become the master of a multihost system.')}</div>
                        </Grid>
                        <Grid item style={styles.controlItem}>
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={this.state.secure}
                                        onChange={e => this.setState({ secure: e.target.checked }, () => this.onChange())}
                                    />
                                }
                                label={this.props.t('With password')}
                            />
                            <div>{ this.props.t('Ask password by connection establishment') }</div>
                        </Grid>
                        { this.state.secure ? <Grid item>
                            <TextField
                                variant="standard"
                                label={this.props.t('Multi-host password')}
                                style={styles.controlItem}
                                value={this.state.password}
                                type="password"
                                inputProps={{
                                    autoComplete: 'new-password',
                                    form: {
                                        autoComplete: 'off',
                                    },
                                }}
                                autoComplete="off"
                                onChange={e => this.setState({ password: e.target.value }, () => this.onChange())}
                            />
                        </Grid> : null }
                    </Grid>
                </Grid>
            </form>
        </Paper>;
    }
}

export default withWidth()(BaseSettingsMultihost);

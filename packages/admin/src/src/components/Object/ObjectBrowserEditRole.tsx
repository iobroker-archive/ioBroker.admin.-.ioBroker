import React, { Component } from 'react';
import { withStyles } from '@mui/styles';

import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Button,
    Autocomplete, type Theme,
} from '@mui/material';

import {
    Close as IconCancel,
    Check as IconCheck,
} from '@mui/icons-material';
import type { AdminConnection } from '@iobroker/adapter-react-v5';

const styles: Record<string, any> = (theme: Theme) => ({
    input: {
        marginBottom: theme.spacing(2),
    },
    inputText: {
        width: 400,
        height: 300,
        marginBottom: theme.spacing(2),
    },
    formControl: {
        marginBottom: theme.spacing(2),
        minWidth: 150,
    },
    quality: {
        width: '100%',
    },
});

interface ObjectBrowserEditRoleProps {
    classes: Record<string, string>;
    roles: string[];
    id: string;
    socket: AdminConnection;
    onClose: (obj?: ioBroker.Object) => void;

    t: (text: string, ...args: any[]) => string;
}

interface ObjectBrowserEditRoleState {
    role: string | null;
    initRole: string | null;
    roleInput: string | null;
}

class ObjectBrowserEditRole extends Component<ObjectBrowserEditRoleProps, ObjectBrowserEditRoleState> {
    private object: ioBroker.Object | null = null;

    constructor(props: ObjectBrowserEditRoleProps) {
        super(props);

        this.state = {
            role: null,
            initRole: null,
            roleInput: null,
        };
    }

    componentDidMount() {
        this.props.socket.getObject(this.props.id)
            .then((obj: ioBroker.Object) => {
                this.object = obj;
                const value = obj?.common?.role || null;
                this.setState({ role: value, initRole: value, roleInput: value });
            })
            .catch((e: string) => console.error(e));
    }

    onUpdate() {
        this.object.common = this.object.common || {} as ioBroker.ObjectCommon;
        this.object.common.role = this.state.roleInput;
        this.props.socket.setObject(this.object._id, this.object)
            .then(() => this.props.onClose(this.object));
    }

    render() {
        return <Dialog
            key="objectBrowserEditRole"
            open={!0}
            maxWidth="sm"
            fullWidth
            onClose={() => this.props.onClose()}
            aria-labelledby="edit-role-dialog-title"
            aria-describedby="edit-role-dialog-description"
        >
            <DialogTitle id="edit-role-dialog-title">{this.object ? this.props.t('Update role for %s', this.object._id) : null}</DialogTitle>
            <DialogContent>
                <Autocomplete
                    freeSolo
                    options={this.props.roles}
                    style={{ width: '100%' }}
                    value={this.state.role}
                    onChange={(event, role) => this.setState({ role, roleInput: role })}
                    onInputChange={(event, role) => this.setState({ roleInput: role })}
                    renderInput={params => <TextField
                        variant="standard"
                        {...params}
                        label={this.props.t('Role')}
                    />}
                />
            </DialogContent>
            <DialogActions>
                <Button
                    disabled={this.state.initRole === this.state.roleInput}
                    variant="contained"
                    onClick={() => this.onUpdate()}
                    color="primary"
                    startIcon={<IconCheck />}
                >
                    {this.props.t('Apply')}
                </Button>
                <Button
                    variant="contained"
                    onClick={() => this.props.onClose()}
                    // @ts-expect-error grey is valid color
                    color="grey"
                    startIcon={<IconCancel />}
                >
                    {this.props.t('Cancel')}
                </Button>
            </DialogActions>
        </Dialog>;
    }
}

export default withStyles(styles)(ObjectBrowserEditRole);

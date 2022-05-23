import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import clsx from 'clsx';

import AppBar from '@material-ui/core/AppBar';
import Paper from '@material-ui/core/Paper';
import Fab from '@material-ui/core/Fab';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import Tooltip from '@material-ui/core/Tooltip';
import {IconButton} from '@material-ui/core';

import HelpIcon from '@material-ui/icons/Help';
import PauseIcon from '@material-ui/icons/Pause';
import PlayArrowIcon from '@material-ui/icons/PlayArrow';
import RefreshIcon from '@material-ui/icons/Refresh';

import Router from '@iobroker/adapter-react/Components/Router';
import Icon from '@iobroker/adapter-react/Components/Icon';
import ConfirmDialog from '@iobroker/adapter-react/Dialogs/Confirm';

import JsonConfig from '../components/JsonConfig';
import {green, red} from "@material-ui/core/colors";

const styles = theme => ({
    root: {
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
    },
    scroll: {
        height: '100%',
        overflowY: 'auto'
    },
    instanceIcon: {
        width: 42,
        height: 42,
        marginRight: theme.spacing(2),
        verticalAlign: 'middle'
    },
    button: {
        marginRight: 5,
        width: 36,
        height: 36,
    },
    version: {
        fontSize: 12,
        opacity: 0.8,
        marginLeft: 20,
        marginRight: 10,
    },
    versionAliveConnected: {
        color: '#23a623'
    },
    versionAliveNotConnected: {
        color: '#a67223'
    },
    buttonControl: {
        padding: 5,
        transition: 'opacity 0.2s',
        height: 34
    },
    enabled: {
        color: green[400],
        '&:hover': {
            backgroundColor: green[200]
        }
    },
    disabled: {
        color: red[400],
        '&:hover': {
            backgroundColor: red[200]
        }
    },
    hide: {
        visibility: 'hidden'
    },
});

class Config extends Component {
    constructor(props) {
        super(props);

        this.state ={
            checkedExist: false,
            showStopAdminDialog: false,
            running: false,
            canStart: false,
            alive: false,
            connected: false,
            connectedToHost: false,
        };

        this.refIframe = React.createRef();
        this.registered = false;
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        if (!this.registered && this.refIframe.contentWindow) {
            this.registered = true;
            this.props.onRegisterIframeRef(this.refIframe);
        }
    }

    componentDidMount() {
        // receive messages from IFRAME
        const eventFunc = window.addEventListener ? 'addEventListener' : 'attachEvent';
        const emit = window[eventFunc];
        const eventName = eventFunc === 'attachEvent' ? 'onmessage' : 'message';

        if (this.props.tab) {
            this.props.socket.fileExists(this.props.adapter + '.admin', 'tab.html')
                .then(exist => {
                    if (exist) {
                        this.setState({checkedExist: 'tab.html'});
                    } else {
                        return this.props.socket.fileExists(this.props.adapter + '.admin', 'tab_m.html')
                            .then(exist =>
                                exist ? this.setState({checkedExist: 'tab_m.html'}) : window.alert('Cannot find tab(_m).html'));
                    }
                });
        } else {
            // this.props.socket.getState('system.adapter.' + this.props.adapter + '.' + this.props.instance + '.')
            this.props.socket.subscribeObject('system.adapter.' + this.props.adapter + '.' + this.props.instance, this.onObjectChange);
            this.props.socket.getObject('system.adapter.' + this.props.adapter + '.' + this.props.instance)
                .then(async obj => {
                    const alive = await this.props.socket.getState('system.adapter.' + this.props.adapter + '.' + this.props.instance + '.alive');
                    await this.props.socket.subscribeState('system.adapter.' + this.props.adapter + '.' + this.props.instance + '.alive', this.onStateChange);

                    const connectedToHost = await this.props.socket.getState('system.adapter.' + this.props.adapter + '.' + this.props.instance + '.connected');
                    await this.props.socket.subscribeState('system.adapter.' + this.props.adapter + '.' + this.props.instance + '.connected', this.onStateChange);

                    let connected;
                    try {
                        connected = await this.props.socket.getState(this.props.adapter + '.' + this.props.instance + '.info.connection');
                        this.props.socket.subscribeState('system.adapter.' + this.props.adapter + '.' + this.props.instance + '.info.connection', this.onStateChange);
                    } catch (error) {
                        // ignore
                        connected = null;
                    }

                    this.setState({
                        checkedExist: true,
                        running: obj?.common?.onlyWWW || obj?.common?.enabled, canStart: !obj?.common?.onlyWWW,
                        alive: alive?.val || false,
                        connectedToHost: connectedToHost?.val || false,
                        connected: connected ? connected.val : null,
                    });
                })
                .catch(error => {
                    console.error(error);
                    this.setState({ checkedExist: true, running: false });
                });
        }

        if (!this.registered && this.refIframe.contentWindow) {
            this.registered = true;
            this.props.onRegisterIframeRef(this.refIframe);
        }

        emit(eventName, event => this.closeConfig(event), false);
    }

    onObjectChange = (id, obj) => {
        if (id === 'system.adapter.' + this.props.adapter + '.' + this.props.instance) {
            this.setState({ running: obj?.common?.onlyWWW || obj?.common?.enabled, canStart: !obj?.common?.onlyWWW });
        }
    };

    onStateChange = (id, state) => {
        if (id === 'system.adapter.' + this.props.adapter + '.' + this.props.instance + '.alive') {
            this.setState({ alive: state ? state.val : false });
        } else if (id === 'system.adapter.' + this.props.adapter + '.' + this.props.instance + '.connected') {
            this.setState({ connectedToHost: state ? state.val : false });
        } else if (id === this.props.adapter + '.' + this.props.instance + '.info.connection') {
            this.setState({ connected: state ? state.val : null });
        }
    };

    componentWillUnmount() {
        const eventFunc = window.removeEventListener ? 'removeEventListener' : 'detachEvent';
        const emit = window[eventFunc];
        const eventName = eventFunc === 'detachEvent' ? 'onmessage' : 'message';
        this.props.socket.unsubscribeObject('system.adapter.' + this.props.adapter + '.' + this.props.instance, this.onObjectChange);

        emit(eventName, event => this.closeConfig(event), false);

        this.registered && this.props.onUnregisterIframeRef(this.refIframe);
        this.refIframe = null;
   }

    closeConfig(event) {
        if (event.data === 'close' || event.message === 'close') {
            if (this.props.easyMode){
                Router.doNavigate('easy');
            } else {
                Router.doNavigate('tab-instances');
            }
        } else if (event.data === 'change' || event.message === 'change') {
            this.props.configStored(false);
        } else if (event.data === 'nochange' || event.message === 'nochange') {
            this.props.configStored(true);
        }
    }

    renderHelpButton() {
        if (this.props.jsonConfig) {
            return <div style={{ display: 'inline-block', position: 'absolute', right: 0, top: 5 }}>
                <Tooltip size="small" title={this.props.t('Show help for this adapter')}>
                    <Fab classes={{ root: this.props.classes.button }} onClick={() => {
                        let lang = this.props.lang;
                        if (lang !== 'en' && lang !== 'de' && lang !== 'ru' && lang !== 'zh-cn') {
                            lang = 'en';
                        }
                        window.open(`https://www.iobroker.net/#${lang}/adapters/adapterref/iobroker.${this.props.adapter}/README.md`, 'help');
                    }}>
                        <HelpIcon />
                    </Fab>
                </Tooltip>
            </div>;
        } else {
            return null;
        }
    }

    getConfigurator() {
        if (this.props.jsonConfig) {
            return <JsonConfig
                menuPadding={this.props.menuPadding}
                theme={this.props.theme}
                width={this.props.width}
                adapterName={this.props.adapter}
                instance={this.props.instance}
                socket={this.props.socket}
                themeName={this.props.themeName}
                themeType={this.props.themeType}
                dateFormat={this.props.dateFormat}
                isFloatComma={this.props.isFloatComma}
                configStored={this.props.configStored}
                t={this.props.t}
            />;
        } else {
            const src = `adapter/${this.props.adapter}/` +
                `${this.props.tab ? this.state.checkedExist : (this.props.materialize ? 'index_m.html' : 'index.html')}?` +
                `${this.props.instance || 0}&newReact=true&${this.props.instance || 0}&react=${this.props.themeName}`;

            if (this.state.checkedExist) {
                return <iframe
                    ref={el => this && (this.refIframe = el)}
                    title="config"
                    className={this.props.className}
                    src={src}>
                </iframe>;
            } else {
                return null;
            }
        }
    }

    extendObject = (id, data) => {
        this.props.socket.extendObject(id, data)
            .catch(error => window.alert(error));
    }

    returnStopAdminDialog() {
        return this.state.showStopAdminDialog ? <ConfirmDialog
            title={this.props.t('Please confirm')}
            text={this.props.t('stop_admin', this.props.instance)}
            ok={this.props.t('Stop admin')}
            onClose={result => {
                result && this.extendObject(`system.adapter.${this.props.adapter}.${this.props.instance}`, { common: { enabled: false } });
                this.setState({ showStopAdminDialog: false });
            }}
        /> : null;
    }

    render() {
        const { classes } = this.props;

        if (!this.props.jsonConfig && window.location.port === '3000') {
            return 'Test it in not development mode!';
        } else {
            return <Paper className={classes.root}>
                <AppBar color="default" position="static">
                    <Toolbar variant="dense">
                        <Typography variant="h6" color="inherit">
                            {this.props.jsonConfig ? <Icon src={this.props.icon} className={this.props.classes.instanceIcon} />
                                : null}
                            {`${this.props.t('Instance settings')}: ${this.props.adapter}.${this.props.instance}`}
                            {this.props.version ? <span className={clsx(
                                this.props.classes.version,
                                this.state.alive && this.state.connectedToHost && this.props.classes.versionAliveConnected,
                                this.state.alive && !this.state.connectedToHost && this.props.classes.versionAliveNotConnected,
                            )}>v{this.props.version}</span> : null}
                            <Tooltip title={this.props.t('Start/stop')}>
                                <span>
                                    <IconButton
                                        size="small"
                                        onClick={event => {
                                            event.stopPropagation();
                                            event.preventDefault();
                                            if (this.state.running && this.props.adapter + '.' + this.props.instance === this.props.adminInstance) {
                                                this.setState({ showStopAdminDialog: true });
                                            } else {
                                                this.extendObject(`system.adapter.${this.props.adapter}.${this.props.instance}`, { common: { enabled: !this.state.running } });
                                            }
                                        }}
                                        onFocus={event => event.stopPropagation()}
                                        className={clsx(classes.buttonControl, this.state.canStart ?
                                            (this.state.running ? classes.enabled : classes.disabled) : classes.hide)}
                                    >
                                        {this.state.running ? <PauseIcon /> : <PlayArrowIcon />}
                                    </IconButton>
                                </span>
                            </Tooltip>
                            <Tooltip title={this.props.t('Restart')}>
                                <span>
                                    <IconButton
                                        size="small"
                                        onClick={event => {
                                            event.stopPropagation();
                                            this.extendObject(`system.adapter.${this.props.adapter}.${this.props.instance}`, {});
                                        }}
                                        onFocus={event => event.stopPropagation()}
                                        className={clsx(classes.buttonControl, !this.state.canStart && classes.hide)}
                                        disabled={!this.state.running}
                                    >
                                        <RefreshIcon />
                                    </IconButton>
                                </span>
                            </Tooltip>
                            {/*<IsVisible config={item} name="allowInstanceLink">
                                <Tooltip title={this.props.t('Instance link %s', this.props.instanceItem?.id)}>
                                    <span>
                                        <IconButton
                                            size="small"
                                            className={clsx(classes.buttonControl, (!this.props.instanceItem?.links || !this.props.instanceItem?.links[0]) && classes.hide)}
                                            disabled={!this.state.running}
                                            onClick={event => {
                                                event.stopPropagation();
                                                if (this.props.instanceItem?.links.length === 1) {
                                                    // replace IPv6 Address with [ipv6]:port
                                                    let url = this.props.instanceItem?.links[0].link;
                                                    url = url.replace(/\/\/([0-9a-f]*:[0-9a-f]*:[0-9a-f]*:[0-9a-f]*:[0-9a-f]*:[0-9a-f]*)(:\d+)?\//i, '//[$1]$2/');
                                                    window.open(url, this.props.instanceItem?.id);
                                                } else {
                                                    setShowLinks(true);
                                                }
                                            }}
                                            onFocus={event => event.stopPropagation()}
                                        >
                                            <InputIcon />
                                        </IconButton>
                                    </div>
                                </Tooltip>
                            </IsVisible>*/}
                        </Typography>
                        {this.renderHelpButton()}
                    </Toolbar>
                </AppBar>
                {this.getConfigurator()}
                {this.returnStopAdminDialog()}
            </Paper>;
        }
    }
}

Config.propTypes = {
    menuPadding: PropTypes.number,
    adapter: PropTypes.string,
    instance: PropTypes.number,
    materialize: PropTypes.bool,
    tab: PropTypes.bool,
    jsonConfig: PropTypes.bool,
    socket: PropTypes.object,
    themeName: PropTypes.string,
    themeType: PropTypes.string,
    t: PropTypes.func,
    isFloatComma: PropTypes.bool,
    dateFormat: PropTypes.string,
    className: PropTypes.string,
    icon: PropTypes.string,
    readme: PropTypes.string,
    lang: PropTypes.string,
    easyMode: PropTypes.bool,
    adminInstance: PropTypes.string,
};

export default withStyles(styles)(Config);
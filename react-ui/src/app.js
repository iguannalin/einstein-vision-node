import React, {Component} from 'react';
import Carousel from 'react-bootstrap/Carousel'
import superagent from 'superagent';
import './app.css';
import 'bootstrap/dist/css/bootstrap.min.css';

class App extends Component {
    constructor(props) {
        super(props);
        this.state = {
            labels: {},
            highestFrequency: {
                label: '',
                probability: 0
            },
            images: [],
            product: window.location.href.split('/')[3],
            productDisplayName: window.location.href.split('/')[3].includes('pegasus') ? 'Nike Air Zoom Pegasus 37' : 'Nike React Infinity Run Flyknit'
        };
        this.getScene = this.getScene.bind(this);
        this.importAllImages = this.importAllImages.bind(this);
        this.getFiles = this.getFiles.bind(this);
        this.fetchProbabilities = this.fetchProbabilities.bind(this);
        this.filterProbabilities = this.filterProbabilities.bind(this);
        this.onDrop = this.onDrop.bind(this);
    }

    render() {
        return (
            <div className="component-card">
                <div className="title">
                    <h1 className="intro">
                        {this.state.productDisplayName}:
                    </h1>
                    <p className="prediction" id="statement"><span className="loading-dots">...</span></p>
                </div>
                <div className="footer">
                    <div className="carousel-container">
                        <Carousel indicators={false} controls={false} interval={200}>
                            {this.state.images.map((image, index) => {
                                return (
                                    <Carousel.Item>
                                        <img
                                            key={index}
                                            className="d-block w-100 h-75"
                                            src={image.url}
                                            alt="Second slide"
                                        />
                                    </Carousel.Item>
                                )
                            })
                            }
                        </Carousel>
                    </div>
                </div>
            </div>
        );
    }

    componentDidMount() {
        if (window.location.href.split('/')[3].includes('pegasus') && window.location.href.split('/')[3].includes('react')) {
            this.setState({
                product: '00009042',
                productDisplayName: 'Nike 00009042'
            });
        }
        this.getFiles();
    }

    getScene() {
        if (typeof this.state.labels === 'object') {
            for (let key in this.state.labels) {
                if (this.state.labels[key] > this.state.highestFrequency.probability) {
                    console.log('this label ', this.state.labels[key], ' is greater ', this.state.highestFrequency.probability);
                    this.setState({
                        highestFrequency: {label: key, probability: this.state.labels[key]}
                    });
                }
                document.getElementById('statement').innerHTML = 'Popular at the ' + this.state.highestFrequency.label;
            }
        }
    };

    // Import all images in image folder by Gabriel Esu
    importAllImages(r) {
        let images = [];
        r.keys().map((item) => {
            return images.push({name: item.replace('./', ''), url: r(item)});
        });
        return images;
    };

    getFiles() {
        let images;
        if (this.state.product.includes('pegasus')) {
            images = this.importAllImages(require.context('../public/images/pegasus', false, /\.(gif|jpe?g|svg|png)$/));
        } else if (this.state.product.includes('react')) {
            images = this.importAllImages(require.context('../public/images/react', false, /\.(gif|jpe?g|svg|png)$/));
        } else {
            images = this.importAllImages(require.context('../public/images/00009042', false, /\.(gif|jpe?g|svg|png)$/));
        }
        this.setState({
            images: images
        });
        this.fetchProbabilities(images);
    };

    fetchProbabilities(images) {
        images.forEach(image => {
            fetch(image.url).then(data => data.blob()).then(res => {
                let file = new File([res], image.name);
                this.onDrop([file]);
            });
        })
    }

    filterProbabilities(res) {
        let probabilities = JSON.parse(res.text).probabilities;
        let tempLabels = this.state.labels;
        let tempHighestFrequency = this.state.highestFrequency;

        probabilities.forEach(item => {
            if (item.probability > 0.5) {
                if (tempLabels[item.label]) {
                    tempLabels[item.label] += item.probability
                } else {
                    tempLabels[item.label] = item.probability;
                }
                tempHighestFrequency = (item.probability > this.state.highestFrequency.probability) ? item : this.state.highestFrequency;
                this.setState({
                    labels: tempLabels,
                    highestFrequency: tempHighestFrequency
                });
            }
        });
        this.getScene();
    };

    onDrop(acceptedFiles) {
        if (acceptedFiles.length) {
            let req = superagent.post('/file-upload');
            acceptedFiles.forEach((file) => {
                // Backend expects 'file' reference
                req.attach('file', file, file.name);
            });
            req.end(async (err, res) => {
                if (err) {
                    console.log('file-upload error', err);
                    this.setState({uploadError: err.message});
                    return err;
                }
                console.log('file-upload response', res);
                await this.filterProbabilities(res);
                return res;
            });
        }
    }
}

export default App;

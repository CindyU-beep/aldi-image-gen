const Generation = () => {

    const divCount = 300;
    const divs = Array.from({ length: divCount }, (_, index) => (
        <div className="c" key={index}></div>
    ));

    return (
        <div className="x-generation">
            <div className="c-wrap">
                {divs}
            </div>
        </div>
    );
};

export default Generation;